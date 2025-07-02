import json
import time
import undetected_chromedriver as uc
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException

def get_yandex_json(url):
    """Получить JSON от Яндекс.Маркет через браузер"""
    
    print("🚀 Запускаем браузер для Яндекс.Маркет...")
    
    # Настройки для обхода защиты
    options = uc.ChromeOptions()
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")
    options.add_argument("--disable-blink-features=AutomationControlled")
    options.add_argument("--disable-web-security")
    options.add_argument("--disable-features=VizDisplayCompositor")
    options.add_argument("user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")
    
    # Отключаем headless для отладки - вы увидите что происходит
    # options.add_argument("--headless=new")
    
    driver = uc.Chrome(options=options)
    
    try:
        print(f"📡 Загружаем URL: {url[:100]}...")
        driver.get(url)
        
        print("⏳ Ждем загрузки страницы...")
        time.sleep(8)  # Даем больше времени на загрузку
        
        # Проверяем на капчу
        try:
            captcha_element = driver.find_element(By.CSS_SELECTOR, '[class*="captcha"], [class*="Captcha"], [id*="captcha"]')
            if captcha_element:
                print("⚠️ Обнаружена капча! Ждем ручного решения...")
                print("🔍 Пожалуйста, решите капчу в браузере и нажмите Enter...")
                input("Нажмите Enter после решения капчи: ")
        except:
            print("✅ Капча не обнаружена")
        
        # Прокручиваем страницу для загрузки всех данных
        print("📜 Прокручиваем страницу для загрузки данных...")
        for i in range(3):
            driver.execute_script("window.scrollTo(0, document.body.scrollHeight);")
            time.sleep(2)
        
        # Ищем JSON данные в сети
        print("🔍 Ищем JSON данные...")
        
        # Способ 1: Ищем в теге <pre> или <script>
        json_text = None
        
        try:
            # Ищем в теге <pre>
            pre_elements = driver.find_elements(By.TAG_NAME, "pre")
            for pre in pre_elements:
                text = pre.text.strip()
                if text.startswith("{") or text.startswith("["):
                    json_text = text
                    print("✅ JSON найден в теге <pre>")
                    break
        except:
            pass
        
        if not json_text:
            try:
                # Ищем в тегах <script>
                script_elements = driver.find_elements(By.TAG_NAME, "script")
                for script in script_elements:
                    content = script.get_attribute("innerHTML")
                    if content and ("window.__INITIAL_STATE__" in content or "window.__DATA__" in content):
                        print("✅ Найден скрипт с данными")
                        # Извлекаем JSON из скрипта
                        if "window.__INITIAL_STATE__" in content:
                            start = content.find("window.__INITIAL_STATE__ = ") + len("window.__INITIAL_STATE__ = ")
                            end = content.find(";", start)
                            if end == -1:
                                end = content.find("</script>", start)
                            json_text = content[start:end].strip()
                        break
            except:
                pass
        
        if not json_text:
            # Способ 2: Берем весь текст body
            try:
                body = driver.find_element(By.TAG_NAME, "body")
                json_text = body.text
                print("✅ Текст получен из body")
            except:
                print("❌ Не удалось получить текст страницы")
        
        if json_text:
            # Пытаемся распарсить JSON
            try:
                data = json.loads(json_text)
                print("✅ JSON успешно распарсен!")
                
                # Сохраняем в файл
                filename = "yandex_market_response.json"
                with open(filename, "w", encoding="utf-8") as f:
                    json.dump(data, f, ensure_ascii=False, indent=2)
                print(f"💾 JSON сохранен в файл: {filename}")
                
                # Показываем структуру
                print("\n📊 Структура JSON:")
                print(f"- Ключи верхнего уровня: {list(data.keys())}")
                
                # Анализируем структуру
                analyze_yandex_structure(data)
                
                return data
                
            except json.JSONDecodeError as e:
                print(f"❌ Ошибка парсинга JSON: {e}")
                print("📄 Сохраняем HTML и текст для анализа...")
                
                # Сохраняем HTML
                with open("yandex_response.html", "w", encoding="utf-8") as f:
                    f.write(driver.page_source)
                print("💾 HTML сохранен в файл: yandex_response.html")
                
                # Сохраняем текст
                if json_text:
                    with open("yandex_response.txt", "w", encoding="utf-8") as f:
                        f.write(json_text)
                    print("💾 Текст сохранен в файл: yandex_response.txt")
        else:
            print("❌ Не удалось получить JSON со страницы")
            
            # Сохраняем HTML для отладки
            with open("yandex_error.html", "w", encoding="utf-8") as f:
                f.write(driver.page_source)
            print("💾 HTML страницы сохранен в: yandex_error.html")
            
    except Exception as e:
        print(f"❌ Произошла ошибка: {e}")
        import traceback
        traceback.print_exc()
        
    finally:
        print("\n🔄 Закрываем браузер...")
        driver.quit()
        print("✅ Готово!")

def analyze_yandex_structure(data):
    """Анализ структуры JSON от Яндекс.Маркет"""
    print("\n🔍 АНАЛИЗ СТРУКТУРЫ ЯНДЕКС.МАРКЕТ:")
    print("=" * 60)
    
    if isinstance(data, dict):
        for key, value in data.items():
            if isinstance(value, (dict, list)):
                print(f"- {key}: {type(value).__name__} ({len(value)} элементов)")
            else:
                print(f"- {key}: {type(value).__name__}")
                
        # Ищем ключи, которые могут содержать товары
        product_keys = []
        for key in data.keys():
            if any(word in key.lower() for word in ["product", "item", "goods", "catalog", "search"]):
                product_keys.append(key)
        
        if product_keys:
            print(f"\n🎯 Возможные ключи с товарами: {product_keys}")
    
    elif isinstance(data, list):
        print(f"- Массив с {len(data)} элементами")
        if data:
            print(f"- Тип первого элемента: {type(data[0]).__name__}")

if __name__ == "__main__":
    # URL Яндекс.Маркет для RTX 5080
    url = "https://market.yandex.ru/search?text=rtx5080&hid=91031&how=aprice&rs=eJwz0qhi4Zh-nPUTIwcHgwSDApD5l3GG_4d9vUzafrz2U5lskpjsVzABhQESHA1M&glfilter=36036031%3A60497935"
    
    print("🎯 Получаем JSON от Яндекс.Маркет\n")
    get_yandex_json(url) 