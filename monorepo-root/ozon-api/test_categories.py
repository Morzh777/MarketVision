#!/usr/bin/env python3
"""
Тестирование всех категорий Ozon API
"""

import asyncio
from src.infrastructure.services.ozon_parser_service import OzonParserService

async def test_categories():
    """Тест всех категорий"""
    
    # Категории для тестирования
    categories = {
        "videocards": ("rtx 5070", "videokarty-15721"),
        "processors": ("7800x3d", "protsessory-15726"),
        "motherboards": ("Z790", "materinskie-platy-15725"),
        "playstation": ("playstation 5 pro", "konsoli-playstation-31751/playstation-79966341"),
        "iphone": ("iphone 16 pro", "smartfony-15502/apple-26303000")
    }
    
    parser_service = OzonParserService()
    
    try:
        for category_name, (query, category_slug) in categories.items():
            print(f"\n🔍 Тестируем категорию: {category_name}")
            print(f"   Запрос: {query}")
            print(f"   Slug: {category_slug}")
            
            try:
                products = await parser_service.parse_products(
                    query=query,
                    category_slug=category_slug
                )
                
                print(f"   ✅ Найдено товаров: {len(products)}")
                
                # Показываем первые 3 товара
                for i, product in enumerate(products[:3]):
                    print(f"     {i+1}. {product.name[:50]}... - {product.price}₽")
                
                if len(products) > 3:
                    print(f"     ... и еще {len(products) - 3} товаров")
                    
            except Exception as e:
                print(f"   ❌ Ошибка: {e}")
                
            # Пауза между запросами
            await asyncio.sleep(2)
            
    finally:
        # Закрываем браузер
        await parser_service.close(force=True)

if __name__ == "__main__":
    asyncio.run(test_categories()) 