import asyncio
import json
from typing import List, Dict, Any
from domain.services.parser_service import ParserService
from domain.entities.product import Product
from infrastructure.parsers.ozon_parser import OzonParser

class OzonParserService(ParserService):
    """Сервис парсинга Ozon"""
    
    def __init__(self):
        self.parser = OzonParser()
        self._is_available = True
    
    async def parse_products(self, query: str, category_slug: str) -> List[Product]:
        """Парсить продукты с Ozon"""
        try:
            print(f"🔍 Парсинг Ozon для запроса: {query} в категории {category_slug}")
            
            # Получаем продукты напрямую через парсер с указанной категорией
            products = await self.parser.get_products(query, category_slug)
            
            print(f"✅ Парсинг завершен. Найдено {len(products)} продуктов")
            return products
            
        except Exception as e:
            print(f"❌ Ошибка парсинга: {e}")
            self._is_available = False
            return []
    
    async def close_browser(self):
        """Закрыть браузер после всех запросов"""
        try:
            if self.parser:
                await self.parser.close()
                print("🔌 Браузер закрыт после всех запросов")
        except Exception as e:
            print(f"❌ Ошибка закрытия браузера: {e}")
    
    async def get_raw_data(self, query: str) -> Dict[str, Any]:
        """Получить сырые данные"""
        try:
            products = await self.parser.get_products(query, "videokarty-15721")
            return {
                "status": "success",
                "data": [product.__dict__ for product in products],
                "query": query,
                "timestamp": "2024-01-01T12:00:00"
            }
        except Exception as e:
            return {
                "status": "error",
                "error": str(e),
                "query": query,
                "timestamp": "2024-01-01T12:00:00"
            }
    
    async def is_available(self) -> bool:
        """Проверить доступность парсера"""
        return self._is_available 