import json
import re

def parse_yandex_text():
    """Парсинг товаров из текстового ответа Яндекс.Маркета"""
    
    print("🔍 Парсим товары из текстового ответа Яндекс.Маркета...")
    
    try:
        with open("yandex_response.txt", "r", encoding="utf-8") as f:
            text = f.read()
    except FileNotFoundError:
        print("❌ Файл yandex_response.txt не найден!")
        return
    
    # Ищем товары RTX 5080
    products = []
    
    # Паттерн для поиска товаров
    # Ищем блоки с названиями видеокарт и ценами
    lines = text.split('\n')
    
    current_product = None
    
    for i, line in enumerate(lines):
        line = line.strip()
        
        # Ищем названия товаров (содержат RTX 5080)
        if "RTX 5080" in line and ("Видеокарта" in line or "GeForce" in line):
            if current_product and current_product.get('name'):
                products.append(current_product)
            
            current_product = {
                'name': line,
                'id': f"yandex_{len(products)}",
                'price': 0,
                'old_price': None,
                'discount': None,
                'brand': None,
                'url': '',
                'images': []
            }
            
            # Извлекаем бренд
            brand_match = re.search(r'^(MSI|Palit|GIGABYTE|ASUS|Colorful|Inno3D)', line)
            if brand_match:
                current_product['brand'] = brand_match.group(1)
        
        # Ищем цены
        elif current_product and "Цена" in line and "₽" in line:
            # Извлекаем цену, убираем все невидимые символы
            price_match = re.search(r'(\d{1,3}(?:\s\d{3})*)\s*₽', line)
            if price_match:
                price_str = price_match.group(1)
                # Убираем все пробелы и невидимые символы
                price_str = re.sub(r'[\s\u2009\u2008\u2007\u2006\u2005\u2004\u2003\u2002\u2001\u2000\u00A0]', '', price_str)
                try:
                    current_product['price'] = int(price_str)
                except ValueError:
                    print(f"⚠️ Не удалось распарсить цену: '{price_str}' из строки: '{line}'")
        
        # Ищем скидки
        elif current_product and "%" in line and line.strip().isdigit():
            current_product['discount'] = f"-{line.strip()}%"
    
    # Добавляем последний товар
    if current_product and current_product.get('name'):
        products.append(current_product)
    
    print(f"✅ Найдено товаров RTX 5080: {len(products)}")
    
    if products:
        # Сохраняем товары
        with open("yandex_rtx5080_products.json", "w", encoding="utf-8") as f:
            json.dump(products, f, ensure_ascii=False, indent=2)
        print("💾 Товары сохранены в yandex_rtx5080_products.json")
        
        # Показываем статистику
        print("\n🛍️ НАЙДЕННЫЕ ТОВАРЫ:")
        for i, product in enumerate(products, 1):
            print(f"\n{i}. {product['name']}")
            print(f"   Бренд: {product['brand'] or 'Не указан'}")
            print(f"   Цена: {product['price']:,} ₽")
            if product.get('discount'):
                print(f"   Скидка: {product['discount']}")
        
        # Статистика цен
        prices = [p["price"] for p in products if p["price"] > 0]
        if prices:
            print(f"\n💰 СТАТИСТИКА ЦЕН:")
            print(f"   Минимальная: {min(prices):,} ₽")
            print(f"   Максимальная: {max(prices):,} ₽")
            print(f"   Средняя: {sum(prices)//len(prices):,} ₽")
            print(f"   Количество товаров: {len(prices)}")
        
        return products
    else:
        print("❌ Товары RTX 5080 не найдены")
        return []

def extract_products_advanced():
    """Продвинутый парсинг с использованием регулярных выражений"""
    
    print("🔍 Продвинутый парсинг товаров...")
    
    try:
        with open("yandex_response.txt", "r", encoding="utf-8") as f:
            text = f.read()
    except FileNotFoundError:
        print("❌ Файл yandex_response.txt не найден!")
        return
    
    # Более точный паттерн для поиска товаров
    # Ищем блоки с названием, ценой и характеристиками
    product_pattern = r'Видеокарта\s+([^₽]+?)\s+Цена\s+(\d{1,3}(?:\s\d{3})*)\s*₽'
    
    matches = re.finditer(product_pattern, text, re.DOTALL)
    products = []
    
    for i, match in enumerate(matches):
        name = match.group(1).strip()
        price_str = match.group(2)
        
        # Убираем все пробелы и невидимые символы из цены
        price_str = re.sub(r'[\s\u2009\u2008\u2007\u2006\u2005\u2004\u2003\u2002\u2001\u2000\u00A0]', '', price_str)
        
        # Проверяем, что это RTX 5080
        if "RTX 5080" in name:
            try:
                product = {
                    'id': f"yandex_advanced_{i}",
                    'name': f"Видеокарта {name}",
                    'price': int(price_str),
                    'brand': None,
                    'url': '',
                    'images': []
                }
                
                # Извлекаем бренд
                brand_match = re.search(r'^(MSI|Palit|GIGABYTE|ASUS|Colorful|Inno3D)', name)
                if brand_match:
                    product['brand'] = brand_match.group(1)
                
                products.append(product)
            except ValueError:
                print(f"⚠️ Не удалось распарсить цену: '{price_str}' для товара: {name}")
    
    print(f"✅ Продвинутым методом найдено товаров: {len(products)}")
    
    if products:
        # Сохраняем товары
        with open("yandex_rtx5080_advanced.json", "w", encoding="utf-8") as f:
            json.dump(products, f, ensure_ascii=False, indent=2)
        print("💾 Товары сохранены в yandex_rtx5080_advanced.json")
        
        # Показываем результаты
        for i, product in enumerate(products, 1):
            print(f"{i}. {product['name']} - {product['price']:,} ₽")
    
    return products

if __name__ == "__main__":
    print("🎯 Парсим товары RTX 5080 из текста Яндекс.Маркета\n")
    
    # Основной парсинг
    products1 = parse_yandex_text()
    
    print("\n" + "="*60 + "\n")
    
    # Продвинутый парсинг
    products2 = extract_products_advanced()
    
    print(f"\n📊 ИТОГО:")
    print(f"   Основной метод: {len(products1)} товаров")
    print(f"   Продвинутый метод: {len(products2)} товаров") 