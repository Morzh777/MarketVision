import json
import pprint

def analyze_yandex_json():
    """Анализ структуры JSON от Яндекс.Маркет"""
    
    # Загружаем JSON
    try:
        with open("yandex_market_response.json", "r", encoding="utf-8") as f:
            data = json.load(f)
    except FileNotFoundError:
        print("❌ Файл yandex_market_response.json не найден!")
        print("🔍 Сначала запустите get_yandex_json.py")
        return
    
    print("📊 АНАЛИЗ СТРУКТУРЫ JSON ЯНДЕКС.МАРКЕТ\n")
    print("=" * 80)
    
    # 1. Верхний уровень
    print("\n1️⃣ КЛЮЧИ ВЕРХНЕГО УРОВНЯ:")
    for key in data.keys():
        value_type = type(data[key]).__name__
        if isinstance(data[key], (list, dict)):
            length = len(data[key])
            print(f"   - {key}: {value_type} ({length} элементов)")
        else:
            print(f"   - {key}: {value_type}")
    
    # 2. Рекурсивный поиск товаров
    print("\n2️⃣ ПОИСК ТОВАРОВ В JSON:")
    products = find_products_recursive(data)
    
    if products:
        print(f"\n✅ Найдено товаров: {len(products)}")
        
        # Сохраняем извлеченные товары
        with open("yandex_products_extracted.json", "w", encoding="utf-8") as f:
            json.dump(products, f, ensure_ascii=False, indent=2)
        print("💾 Товары сохранены в yandex_products_extracted.json")
        
        # Показываем примеры
        print("\n🛍️ ПРИМЕРЫ ИЗВЛЕЧЕННЫХ ТОВАРОВ:")
        for i, product in enumerate(products[:5], 1):
            print(f"\n   Товар {i}:")
            print(f"      Название: {product.get('name', 'Нет названия')}")
            print(f"      Цена: {product.get('price', 0):,} ₽")
            if product.get('old_price'):
                print(f"      Старая цена: {product.get('old_price', 0):,} ₽")
            if product.get('discount'):
                print(f"      Скидка: {product.get('discount')}")
            print(f"      Бренд: {product.get('brand', 'Не указан')}")
            print(f"      URL: {product.get('url', 'Не указан')}")
            print(f"      Изображений: {len(product.get('images', []))}")
        
        # Статистика цен
        prices = [p["price"] for p in products if p.get("price", 0) > 0]
        if prices:
            print(f"\n💰 Статистика цен:")
            print(f"   Минимальная: {min(prices):,} ₽")
            print(f"   Максимальная: {max(prices):,} ₽")
            print(f"   Средняя: {sum(prices)//len(prices):,} ₽")
        
        return products
    else:
        print("❌ Товары не найдены в JSON")
        print("🔍 Попробуйте другой подход к парсингу")

def find_products_recursive(obj, path="", max_depth=5):
    """Рекурсивный поиск товаров в JSON"""
    products = []
    
    if max_depth <= 0:
        return products
    
    if isinstance(obj, dict):
        # Проверяем ключи, которые могут содержать товары
        product_keys = ["products", "items", "goods", "catalog", "searchResults", "offers"]
        
        for key, value in obj.items():
            current_path = f"{path}.{key}" if path else key
            
            # Если ключ похож на список товаров
            if key.lower() in [pk.lower() for pk in product_keys] and isinstance(value, list):
                print(f"   🎯 Найден потенциальный список товаров: {current_path} ({len(value)} элементов)")
                
                # Пытаемся извлечь товары
                extracted = extract_yandex_products(value)
                if extracted:
                    products.extend(extracted)
                    print(f"   ✅ Извлечено товаров: {len(extracted)}")
            
            # Рекурсивно ищем дальше
            elif isinstance(value, (dict, list)):
                products.extend(find_products_recursive(value, current_path, max_depth - 1))
    
    elif isinstance(obj, list):
        # Если это список, проверяем каждый элемент
        for i, item in enumerate(obj):
            current_path = f"{path}[{i}]"
            products.extend(find_products_recursive(item, current_path, max_depth - 1))
    
    return products

def extract_yandex_products(items):
    """Извлечь данные о товарах из списка items"""
    products = []
    
    for item in items:
        try:
            product = {}
            
            # ID товара
            product["id"] = str(item.get("id", item.get("sku", item.get("productId", ""))))
            
            # Название
            name = item.get("name", item.get("title", item.get("productName", "")))
            if name:
                product["name"] = name
            
            # URL
            url = item.get("url", item.get("link", item.get("href", "")))
            if url:
                if not url.startswith("http"):
                    url = "https://market.yandex.ru" + url
                product["url"] = url
            
            # Цена
            price_data = item.get("price", {})
            if isinstance(price_data, dict):
                price = price_data.get("value", price_data.get("amount", 0))
                if price:
                    product["price"] = int(price)
            elif isinstance(price_data, (int, float)):
                product["price"] = int(price_data)
            
            # Старая цена
            old_price_data = item.get("oldPrice", item.get("originalPrice", {}))
            if isinstance(old_price_data, dict):
                old_price = old_price_data.get("value", old_price_data.get("amount", 0))
                if old_price:
                    product["old_price"] = int(old_price)
            elif isinstance(old_price_data, (int, float)):
                product["old_price"] = int(old_price_data)
            
            # Скидка
            discount = item.get("discount", item.get("discountPercent", ""))
            if discount:
                product["discount"] = str(discount)
            
            # Бренд
            brand = item.get("brand", item.get("vendor", ""))
            if brand:
                if isinstance(brand, dict):
                    brand = brand.get("name", "")
                product["brand"] = str(brand)
            
            # Изображения
            images = []
            image_data = item.get("images", item.get("pictures", []))
            if isinstance(image_data, list):
                for img in image_data:
                    if isinstance(img, dict):
                        img_url = img.get("url", img.get("src", ""))
                    else:
                        img_url = str(img)
                    if img_url:
                        images.append(img_url)
            product["images"] = images
            
            # Проверяем, что товар содержит RTX 5080
            if product.get("name") and "rtx" in product["name"].lower() and "5080" in product["name"]:
                products.append(product)
            
        except Exception as e:
            print(f"   ⚠️ Ошибка извлечения товара: {e}")
            continue
    
    return products

if __name__ == "__main__":
    analyze_yandex_json() 