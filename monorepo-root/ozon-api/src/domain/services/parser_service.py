from abc import ABC, abstractmethod
from typing import List, Dict, Any
from ..entities.product import Product

class ParserService(ABC):
    """Абстрактный сервис парсинга"""
    
    @abstractmethod
    async def parse_products(self, query: str, category_slug: str) -> List[Product]:
        """Парсить продукты с сайта"""
        pass
    
    @abstractmethod
    async def get_raw_data(self) -> Dict[str, Any]:
        """Получить сырые данные"""
        pass
    
    @abstractmethod
    async def is_available(self) -> bool:
        """Проверить доступность парсера"""
        pass 