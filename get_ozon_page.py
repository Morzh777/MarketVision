import json
import time
import undetected_chromedriver as uc
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException

def extract_products(items):
    """Извлечь данные о товарах из items в унифицированном формате для product-filter-service"""
    products = []
    
    for item in items:
        try:
            product = {}
            
            # Обязательные поля для product-filter-service
            product["id"] = str(item.get("sku", ""))
            product["name"] = ""
            product["price"] = 0
            product["description"] = ""
            product["image_url"] = ""
            product["product_url"] = ""
            product["images"] = []
            product["characteristics"] = {}
            product["category"] = "videocards"  # По умолчанию для Ozon
            product["availability"] = "available"
            
            # Ссылка
            if "action" in item and isinstance(item["action"], dict):
                product["product_url"] = "https://www.ozon.ru" + item["action"].get("link", "")
            
            # Основная информация из mainState
            if "mainState" in item:
                for state in item["mainState"]:
                    if state.get("type") == "textAtom" and state.get("id") == "name":
                        # Название
                        product["name"] = state.get("textAtom", {}).get("text", "")
                        
                    elif state.get("type") == "priceV2":
                        # Цены
                        price_data = state.get("priceV2", {})
                        prices = price_data.get("price", [])
                        
                        for price_item in prices:
                            if price_item.get("textStyle") == "PRICE":
                                # Текущая цена
                                price_text = price_item.get("text", "0")
                                product["price"] = int(''.join(filter(str.isdigit, price_text)))
                            elif price_item.get("textStyle") == "ORIGINAL_PRICE":
                                # Старая цена - добавляем в характеристики
                                old_price_text = price_item.get("text", "0")
                                old_price = int(''.join(filter(str.isdigit, old_price_text)))
                                if old_price > 0:
                                    product["characteristics"]["old_price"] = str(old_price)
                        
                        # Скидка
                        discount_text = price_data.get("discount", "")
                        if discount_text:
                            product["characteristics"]["discount"] = discount_text
                    
                    elif state.get("type") == "labelList":
                        # Бренд и другие метки
                        labels = state.get("labelList", {}).get("items", [])
                        for label in labels:
                            title = label.get("title", "")
                            # Извлекаем бренд из жирного текста
                            if "<b>" in title and "</b>" in title:
                                brand = title.replace("<b>", "").replace("</b>", "").strip()
                                if brand and not any(word in brand.lower() for word in ["оригинал", "рейтинг"]):
                                    product["characteristics"]["brand"] = brand
            
            # Изображения
            if "tileImage" in item:
                images = []
                for img_item in item.get("tileImage", {}).get("items", []):
                    if img_item.get("type") == "image":
                        img_url = img_item.get("image", {}).get("link", "")
                        if img_url:
                            images.append(img_url)
                product["images"] = images
                if images:
                    product["image_url"] = images[0]  # Первое изображение как основное
            
            # Наличие и доставка из кнопки
            if "multiButton" in item:
                button_data = item.get("multiButton", {}).get("ozonButton", {})
                if button_data.get("type") == "addToCart":
                    cart_data = button_data.get("addToCart", {})
                    action_button = cart_data.get("actionButton", {})
                    if action_button:
                        delivery = action_button.get("common", {}).get("title", "")
                        if delivery:
                            product["characteristics"]["delivery"] = delivery
                        
                        # Продавец (премиум или обычный)
                        seller_icon = action_button.get("common", {}).get("sellerIcon", {})
                        if seller_icon:
                            product["characteristics"]["is_premium_seller"] = "true"
            
            # Дополнительные поля для совместимости
            product["supplier"] = "Ozon"
            product["source"] = "ozon"
            
            products.append(product)
            
        except Exception as e:
            print(f"   ⚠️ Ошибка извлечения товара: {e}")
            continue
    
    return products

def analyze_ozon_data(data):
    """Анализ данных Ozon и извлечение товаров в унифицированном формате"""
    print("\n📊 АНАЛИЗ ДАННЫХ OZON:")
    print("=" * 60)
    
    if "widgetStates" in data:
        for widget_id, widget_data in data["widgetStates"].items():
            # Ищем tileGridDesktop который содержит товары
            if "tileGridDesktop" in widget_id and isinstance(widget_data, str):
                try:
                    widget_content = json.loads(widget_data)
                    if "items" in widget_content:
                        items = widget_content["items"]
                        print(f"✅ Найдено товаров в {widget_id}: {len(items)}")
                        
                        # Извлекаем товары
                        products = extract_products(items)
                        
                        if products:
                            print(f"✅ Извлечено товаров: {len(products)}")
                            
                            # Формируем унифицированный формат для product-filter-service
                            unified_data = {
                                "query": "rtx 5080",  # По умолчанию, можно сделать параметром
                                "products": products,
                                "stats": {
                                    "totalInput": len(items),
                                    "totalFiltered": len(products),
                                    "processingTimeMs": 0
                                }
                            }
                            
                            # Сохраняем в унифицированном формате
                            with open("ozon_all_products.json", "w", encoding="utf-8") as f:
                                json.dump([unified_data], f, ensure_ascii=False, indent=2)
                            print("💾 Данные сохранены в ozon_all_products.json в унифицированном формате")
                            
                            # Показываем примеры
                            print("\n🛍️ ПРИМЕРЫ ТОВАРОВ:")
                            for i, product in enumerate(products[:5], 1):
                                print(f"\n{i}. {product.get('name', 'Нет названия')}")
                                print(f"   Бренд: {product.get('characteristics', {}).get('brand', 'Не указан')}")
                                print(f"   Цена: {product.get('price', 0):,} ₽")
                                if product.get('characteristics', {}).get('old_price'):
                                    old_price = product.get('characteristics', {}).get('old_price')
                                    print(f"   Старая цена: {old_price} ₽")
                                if product.get('characteristics', {}).get('discount'):
                                    print(f"   Скидка: {product.get('characteristics', {}).get('discount')}")
                                print(f"   URL: {product.get('product_url', 'Не указан')}")
                                print(f"   Изображений: {len(product.get('images', []))}")
                                print(f"   Источник: {product.get('source', 'Не указан')}")
                            
                            # Статистика цен
                            prices = [p["price"] for p in products if p.get("price", 0) > 0]
                            if prices:
                                print(f"\n💰 СТАТИСТИКА ЦЕН:")
                                print(f"   Минимальная: {min(prices):,} ₽")
                                print(f"   Максимальная: {max(prices):,} ₽")
                                print(f"   Средняя: {sum(prices)//len(prices):,} ₽")
                                print(f"   Количество товаров: {len(prices)}")
                            
                            return [unified_data]
                        else:
                            print("❌ Не удалось извлечь товары")
                            
                except Exception as e:
                    print(f"⚠️ Ошибка анализа виджета {widget_id}: {e}")
                    continue
    else:
        print("❌ Структура widgetStates не найдена в JSON")
    
    return []

def get_ozon_page1_json():
    """Получить JSON с первой страницы результатов и сразу проанализировать"""
    
    print("🚀 Получаем данные с ПЕРВОЙ страницы Ozon...")
    
    # URL для первой страницы
    api_url = "https://www.ozon.ru/api/entrypoint-api.bx/page/json/v2?url=%2Fcategory%2Fvideokarty-15721%2F%3F__rr%3D2%26abt_att%3D1%26deny_category_prediction%3Dtrue%26from_global%3Dtrue%26page%3D1%26sorting%3Dprice%26text%3Drtx%2B5080"
    
    print(f"📡 URL: {api_url[:100]}...")
    
    # Настройки браузера
    options = uc.ChromeOptions()
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")
    options.add_argument("--disable-blink-features=AutomationControlled")
    options.add_argument("user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")
    
    driver = uc.Chrome(options=options)
    
    try:
        driver.get(api_url)
        print("⏳ Ждем загрузки JSON...")
        time.sleep(5)
        
        # Получаем JSON
        json_text = None
        
        try:
            pre_element = WebDriverWait(driver, 10).until(
                EC.presence_of_element_located((By.TAG_NAME, "pre"))
            )
            json_text = pre_element.text
            print("✅ JSON найден!")
        except TimeoutException:
            json_text = driver.find_element(By.TAG_NAME, "body").text
            print("✅ Текст получен из body")
        
        if json_text:
            try:
                data = json.loads(json_text)
                
                # Сохраняем сырой JSON
                with open("ozon_page1_response.json", "w", encoding="utf-8") as f:
                    json.dump(data, f, ensure_ascii=False, indent=2)
                print("💾 JSON сохранен в ozon_page1_response.json")
                
                # Сразу анализируем и извлекаем товары
                products = analyze_ozon_data(data)
                
                return data, products
                
            except json.JSONDecodeError as e:
                print(f"❌ Ошибка парсинга JSON: {e}")
                with open("ozon_page1_error.txt", "w", encoding="utf-8") as f:
                    f.write(json_text)
                return None, []
                    
    except Exception as e:
        print(f"❌ Ошибка: {e}")
        import traceback
        traceback.print_exc()
        return None, []
        
    finally:
        try:
            driver.quit()
        except Exception:
            pass  # Игнорируем ошибки при закрытии браузера
        print("\n✅ Готово!")

if __name__ == "__main__":
    print("🎯 Получаем и анализируем данные Ozon в одном скрипте\n")
    data, products = get_ozon_page1_json()
    
    if products:
        print(f"\n🎉 УСПЕХ! Найдено {len(products)} товаров")
    else:
        print("\n❌ Товары не найдены") 