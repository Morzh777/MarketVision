from dataclasses import dataclass
from datetime import datetime
from typing import Any, Dict, List, Optional


@dataclass
class Product:
    """Доменная сущность товара"""

    id: str
    name: str
    price: float
    description: Optional[str] = None
    image_url: Optional[str] = None
    product_url: Optional[str] = None
    images: List[str] = None
    characteristics: Dict[str, Any] = None
    category: str = "videocards"
    availability: bool = True
    supplier: str = "Ozon"
    source: str = "ozon"
    created_at: Optional[datetime] = None

    def __post_init__(self) -> None:
        if self.images is None:
            self.images = []
        if self.characteristics is None:
            self.characteristics = {}
        if self.created_at is None:
            self.created_at = datetime.now()

    def to_dict(self) -> Dict[str, Any]:
        """Конвертация в словарь"""
        return {
            "id": self.id,
            "name": self.name,
            "price": self.price,
            "description": self.description,
            "image_url": self.image_url,
            "product_url": self.product_url,
            "images": self.images,
            "characteristics": self.characteristics,
            "category": self.category,
            "availability": self.availability,
            "supplier": self.supplier,
            "source": self.source,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "Product":
        """Создание из словаря"""
        return cls(**data)
