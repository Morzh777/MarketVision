import asyncio
from typing import List
from unittest.mock import AsyncMock, Mock, patch

import pytest

from domain.entities.product import Product
from infrastructure.services.ozon_parser_service import OzonParserService


class TestOzonParserService:
    """Тесты для OzonParserService"""

    @pytest.fixture
    def mock_parser(self) -> Mock:
        """Мок для OzonParser"""
        return Mock()

    @pytest.fixture
    def service(self, mock_parser: Mock) -> OzonParserService:
        """Фикстура сервиса с мок-парсером"""
        with patch(
            "infrastructure.services.ozon_parser_service.OzonParser",
            return_value=mock_parser,
        ):
            return OzonParserService()

    @pytest.fixture
    def sample_products(self) -> List[Product]:
        """Образцы продуктов для тестов"""
        return [
            Product(
                id="1",
                name="RTX 4090",
                price=150000.0,
                category="videocards",
                image_url="https://example.com/image1.jpg",
                product_url="https://example.com/product1",
            ),
            Product(
                id="2",
                name="RTX 4080",
                price=120000.0,
                category="videocards",
                image_url="https://example.com/image2.jpg",
                product_url="https://example.com/product2",
            ),
        ]

    @pytest.mark.asyncio
    async def test_parse_products_success(
        self,
        service: OzonParserService,
        mock_parser: Mock,
        sample_products: List[Product],
    ) -> None:
        """Тест успешного парсинга продуктов"""
        # Arrange
        mock_parser.get_products = AsyncMock(return_value=sample_products)

        # Act
        result = await service.parse_products("RTX 4090", "videokarty-15721")

        # Assert
        assert len(result) == 2
        assert result[0].name == "RTX 4090"
        assert result[1].name == "RTX 4080"
        mock_parser.get_products.assert_called_once_with(
            "RTX 4090", "videokarty-15721", None
        )

    @pytest.mark.asyncio
    async def test_parse_products_with_platform_id(
        self,
        service: OzonParserService,
        mock_parser: Mock,
        sample_products: List[Product],
    ) -> None:
        """Тест парсинга с platform_id"""
        # Arrange
        mock_parser.get_products = AsyncMock(return_value=sample_products)

        # Act
        result = await service.parse_products(
            "RTX 4090", "videokarty-15721", "nintendo-switch"
        )

        # Assert
        assert len(result) == 2
        mock_parser.get_products.assert_called_once_with(
            "RTX 4090", "videokarty-15721", "nintendo-switch"
        )

    @pytest.mark.asyncio
    async def test_parse_products_empty_query_raises_error(
        self, service: OzonParserService
    ) -> None:
        """Тест ошибки при пустом запросе"""
        # Act & Assert
        with pytest.raises(ValueError, match="Query cannot be empty"):
            await service.parse_products("", "videokarty-15721")

        with pytest.raises(ValueError, match="Query cannot be empty"):
            await service.parse_products("   ", "videokarty-15721")

    @pytest.mark.asyncio
    async def test_parse_products_empty_category_raises_error(
        self, service: OzonParserService
    ) -> None:
        """Тест ошибки при пустой категории"""
        # Act & Assert
        with pytest.raises(ValueError, match="Category slug cannot be empty"):
            await service.parse_products("RTX 4090", "")

        with pytest.raises(ValueError, match="Category slug cannot be empty"):
            await service.parse_products("RTX 4090", "   ")

    @pytest.mark.asyncio
    async def test_parse_products_parser_error_raises_runtime_error(
        self, service: OzonParserService, mock_parser: Mock
    ) -> None:
        """Тест обработки ошибок парсера"""
        # Arrange
        mock_parser.get_products = AsyncMock(side_effect=Exception("Network error"))

        # Act & Assert
        with pytest.raises(RuntimeError, match="Parsing failed: Network error"):
            await service.parse_products("RTX 4090", "videokarty-15721")

        # Проверяем, что сервис помечен как недоступный
        assert not await service.is_available()

    @pytest.mark.asyncio
    async def test_get_raw_data_success(
        self,
        service: OzonParserService,
        mock_parser: Mock,
        sample_products: List[Product],
    ) -> None:
        """Тест успешного получения сырых данных"""
        # Arrange
        mock_parser.get_products = AsyncMock(return_value=sample_products)

        # Act
        result = await service.get_raw_data("RTX 4090")

        # Assert
        assert result["status"] == "success"
        assert result["query"] == "RTX 4090"
        assert result["total_count"] == 2
        assert len(result["data"]) == 2
        assert isinstance(result["data"][0], dict)

    @pytest.mark.asyncio
    async def test_get_raw_data_empty_query_raises_error(
        self, service: OzonParserService
    ) -> None:
        """Тест ошибки при пустом запросе в get_raw_data"""
        # Act & Assert
        with pytest.raises(ValueError, match="Query cannot be empty"):
            await service.get_raw_data("")

    @pytest.mark.asyncio
    async def test_get_raw_data_parser_error_returns_error_dict(
        self, service: OzonParserService, mock_parser: Mock
    ) -> None:
        """Тест обработки ошибок в get_raw_data"""
        # Arrange
        mock_parser.get_products = AsyncMock(side_effect=Exception("Network error"))

        # Act
        result = await service.get_raw_data("RTX 4090")

        # Assert
        assert result["status"] == "error"
        assert result["error"] == "Network error"
        assert result["query"] == "RTX 4090"
        assert result["total_count"] == 0

    @pytest.mark.asyncio
    async def test_close_success(
        self, service: OzonParserService, mock_parser: Mock
    ) -> None:
        """Тест успешного закрытия ресурсов"""
        # Arrange
        mock_parser.close = AsyncMock()

        # Act
        await service.close()

        # Assert
        mock_parser.close.assert_called_once()

    @pytest.mark.asyncio
    async def test_close_parser_error_raises_exception(
        self, service: OzonParserService, mock_parser: Mock
    ) -> None:
        """Тест обработки ошибок при закрытии"""
        # Arrange
        mock_parser.close = AsyncMock(side_effect=Exception("Close error"))

        # Act & Assert
        with pytest.raises(Exception, match="Close error"):
            await service.close()

    @pytest.mark.asyncio
    async def test_is_available_initial_state(self, service: OzonParserService) -> None:
        """Тест начального состояния доступности"""
        # Act & Assert
        assert await service.is_available() is True
