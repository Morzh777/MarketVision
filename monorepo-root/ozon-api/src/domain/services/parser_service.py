from abc import ABC, abstractmethod
from typing import Any, Dict, List, Optional

from ..entities.product import Product


class ParserService(ABC):
    """Абстрактный сервис парсинга"""

    @abstractmethod
    async def parse_products(
        self, query: str, category_slug: str, platform_id: Optional[str] = None
    ) -> List[Product]:
        """Парсить продукты с сайта"""
        pass

    @abstractmethod
    async def get_raw_data(self, query: str) -> Dict[str, Any]:
        """Получить сырые данные"""
        pass

    @abstractmethod
    async def is_available(self) -> bool:
        """Проверить доступность парсера"""
        pass

    @abstractmethod
    async def close(self) -> None:
        """Закрыть ресурсы парсера"""
        pass
