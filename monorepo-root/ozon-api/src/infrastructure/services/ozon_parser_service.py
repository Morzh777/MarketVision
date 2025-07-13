import asyncio
import json
from typing import List, Dict, Any, Optional
from domain.services.parser_service import ParserService
from domain.entities.product import Product
from infrastructure.parsers.ozon_parser import OzonParser

class OzonParserService(ParserService):
    """Сервис парсинга Ozon с типизацией и обработкой ошибок"""
    
    def __init__(self) -> None:
        self.parser = OzonParser()
        self._is_available = True
    
    async def parse_products(
        self, 
        query: str, 
        category_slug: str, 
        platform_id: Optional[str] = None,
        exactmodels: Optional[str] = None
    ) -> List[Product]:
        """
        Парсить продукты с Ozon
        
        Args:
            query: Поисковый запрос
            category_slug: Слаг категории
            platform_id: ID платформы (опционально)
            exactmodels: ID модели (опционально)
        
        Returns:
            Список продуктов
        
        Raises:
            ValueError: При некорректных входных данных
            RuntimeError: При ошибках парсинга
        """
        if not query or not query.strip():
            raise ValueError("Query cannot be empty")
            
        if not category_slug or not category_slug.strip():
            raise ValueError("Category slug cannot be empty")
        
        try:
            print(f"🔍 Парсинг Ozon для запроса: {query} в категории {category_slug}")
            
            if platform_id:
                print(f"🎮 Получена платформа от Product-Filter-Service: {platform_id}")
            if exactmodels:
                print(f"🔎 Получен exactmodels от Product-Filter-Service: {exactmodels}")
            
            # Получаем продукты напрямую через парсер
            products = await self.parser.get_products(query, category_slug, platform_id, exactmodels)
            
            print(f"✅ Парсинг завершен. Найдено {len(products)} продуктов")
            return products
            
        except Exception as e:
            print(f"❌ Ошибка парсинга: {e}")
            self._is_available = False
            raise RuntimeError(f"Parsing failed: {str(e)}") from e
    
    async def close(self) -> None:
        """Закрыть ресурсы парсера"""
        try:
            if self.parser:
                await self.parser.close()
                print("🔌 Браузер закрыт")
        except Exception as e:
            print(f"❌ Ошибка закрытия браузера: {e}")
            raise
    
    async def get_raw_data(self, query: str) -> Dict[str, Any]:
        """
        Получить сырые данные
        
        Args:
            query: Поисковый запрос
            
        Returns:
            Словарь с сырыми данными
        """
        if not query or not query.strip():
            raise ValueError("Query cannot be empty")
            
        try:
            products = await self.parser.get_products(query, "videokarty-15721")
            return {
                "status": "success",
                "data": [product.to_dict() for product in products],
                "query": query,
                "total_count": len(products),
                "timestamp": "2024-01-01T12:00:00"
            }
        except Exception as e:
            return {
                "status": "error",
                "error": str(e),
                "query": query,
                "total_count": 0,
                "timestamp": "2024-01-01T12:00:00"
            }
    
    async def is_available(self) -> bool:
        """Проверить доступность парсера"""
        return self._is_available 