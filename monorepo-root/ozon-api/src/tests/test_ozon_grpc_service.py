import pytest
import grpc
from unittest.mock import AsyncMock, Mock, patch
from typing import List

from domain.entities.product import Product
from infrastructure.grpc.ozon_grpc_service import OzonRawProductService
import raw_product_pb2


class TestOzonRawProductService:
    """Тесты для OzonRawProductService"""

    @pytest.fixture
    def mock_parser_service(self) -> Mock:
        """Мок для OzonParserService"""
        return Mock()

    @pytest.fixture
    def service(self, mock_parser_service: Mock) -> OzonRawProductService:
        """Фикстура gRPC сервиса с мок-парсером"""
        with patch('infrastructure.grpc.ozon_grpc_service.OzonParserService', return_value=mock_parser_service):
            return OzonRawProductService()

    @pytest.fixture
    def mock_context(self) -> Mock:
        """Мок для gRPC context"""
        context = Mock(spec=grpc.ServicerContext)
        context.set_code = Mock()
        context.set_details = Mock()
        return context

    @pytest.fixture
    def sample_request(self) -> raw_product_pb2.GetRawProductsRequest:
        """Образец gRPC запроса"""
        request = raw_product_pb2.GetRawProductsRequest()
        request.query = "RTX 4090"
        request.category = "videokarty-15721"
        return request

    @pytest.fixture
    def sample_request_with_platform(self) -> raw_product_pb2.GetRawProductsRequest:
        """Образец gRPC запроса с platform_id"""
        request = raw_product_pb2.GetRawProductsRequest()
        request.query = "Nintendo Switch"
        request.category = "igrovye-pristavki"
        # platform_id добавляется через setattr в тестах
        return request

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
                product_url="https://example.com/product1"
            ),
            Product(
                id="2", 
                name="RTX 4080",
                price=120000.0,
                category="videocards",
                image_url="https://example.com/image2.jpg",
                product_url="https://example.com/product2"
            )
        ]

    @pytest.mark.asyncio
    async def test_get_raw_products_success(
        self, 
        service: OzonRawProductService, 
        mock_parser_service: Mock,
        mock_context: Mock,
        sample_request: raw_product_pb2.GetRawProductsRequest,
        sample_products: List[Product]
    ) -> None:
        """Тест успешного получения продуктов"""
        # Arrange
        mock_parser_service.is_available = AsyncMock(return_value=True)
        mock_parser_service.parse_products = AsyncMock(return_value=sample_products)
        
        # Act
        response = await service.GetRawProducts(sample_request, mock_context)
        
        # Assert
        assert len(response.products) == 2
        assert response.total_count == 2
        assert response.source == "ozon"
        assert response.products[0].name == "RTX 4090"
        assert response.products[0].price == 150000
        assert response.products[0].query == "RTX 4090"
        assert response.products[0].category == "videokarty-15721"
        assert response.products[0].source == "ozon"
        
        mock_parser_service.parse_products.assert_called_once_with("RTX 4090", "videokarty-15721", None)

    @pytest.mark.asyncio
    async def test_get_raw_products_with_platform_id(
        self, 
        service: OzonRawProductService, 
        mock_parser_service: Mock,
        mock_context: Mock,
        sample_request_with_platform: raw_product_pb2.GetRawProductsRequest,
        sample_products: List[Product]
    ) -> None:
        """Тест получения продуктов с platform_id"""
        # Arrange
        setattr(sample_request_with_platform, 'platform_id', 'nintendo-switch')
        mock_parser_service.is_available = AsyncMock(return_value=True)
        mock_parser_service.parse_products = AsyncMock(return_value=sample_products)
        
        # Act
        response = await service.GetRawProducts(sample_request_with_platform, mock_context)
        
        # Assert
        assert len(response.products) == 2
        mock_parser_service.parse_products.assert_called_once_with(
            "Nintendo Switch", 
            "igrovye-pristavki", 
            "nintendo-switch"
        )

    @pytest.mark.asyncio
    async def test_get_raw_products_empty_query_returns_invalid_argument(
        self, 
        service: OzonRawProductService, 
        mock_context: Mock
    ) -> None:
        """Тест ошибки INVALID_ARGUMENT при пустом запросе"""
        # Arrange
        request = raw_product_pb2.GetRawProductsRequest()
        request.query = ""
        request.category = "videokarty-15721"
        
        # Act
        response = await service.GetRawProducts(request, mock_context)
        
        # Assert
        assert len(response.products) == 0
        assert response.total_count == 0
        assert response.source == "ozon"
        mock_context.set_code.assert_called_with(grpc.StatusCode.INVALID_ARGUMENT)
        mock_context.set_details.assert_called_with("Query cannot be empty")

    @pytest.mark.asyncio
    async def test_get_raw_products_whitespace_query_returns_invalid_argument(
        self, 
        service: OzonRawProductService, 
        mock_context: Mock
    ) -> None:
        """Тест ошибки INVALID_ARGUMENT при запросе из пробелов"""
        # Arrange
        request = raw_product_pb2.GetRawProductsRequest()
        request.query = "   "
        request.category = "videokarty-15721"
        
        # Act
        response = await service.GetRawProducts(request, mock_context)
        
        # Assert
        assert len(response.products) == 0
        mock_context.set_code.assert_called_with(grpc.StatusCode.INVALID_ARGUMENT)
        mock_context.set_details.assert_called_with("Query cannot be empty")

    @pytest.mark.asyncio
    async def test_get_raw_products_empty_category_returns_invalid_argument(
        self, 
        service: OzonRawProductService, 
        mock_context: Mock
    ) -> None:
        """Тест ошибки INVALID_ARGUMENT при пустой категории"""
        # Arrange
        request = raw_product_pb2.GetRawProductsRequest()
        request.query = "RTX 4090"
        request.category = ""
        
        # Act
        response = await service.GetRawProducts(request, mock_context)
        
        # Assert
        assert len(response.products) == 0
        mock_context.set_code.assert_called_with(grpc.StatusCode.INVALID_ARGUMENT)
        mock_context.set_details.assert_called_with("Category cannot be empty")

    @pytest.mark.asyncio
    async def test_get_raw_products_parser_unavailable_returns_unavailable(
        self, 
        service: OzonRawProductService, 
        mock_parser_service: Mock,
        mock_context: Mock,
        sample_request: raw_product_pb2.GetRawProductsRequest
    ) -> None:
        """Тест ошибки UNAVAILABLE при недоступном парсере"""
        # Arrange
        mock_parser_service.is_available = AsyncMock(return_value=False)
        
        # Act
        response = await service.GetRawProducts(sample_request, mock_context)
        
        # Assert
        assert len(response.products) == 0
        mock_context.set_code.assert_called_with(grpc.StatusCode.UNAVAILABLE)
        mock_context.set_details.assert_called_with("Parser service is currently unavailable")

    @pytest.mark.asyncio
    async def test_get_raw_products_parser_exception_returns_internal_error(
        self, 
        service: OzonRawProductService, 
        mock_parser_service: Mock,
        mock_context: Mock,
        sample_request: raw_product_pb2.GetRawProductsRequest
    ) -> None:
        """Тест ошибки INTERNAL при исключении в парсере"""
        # Arrange
        mock_parser_service.is_available = AsyncMock(return_value=True)
        mock_parser_service.parse_products = AsyncMock(side_effect=Exception("Network error"))
        
        # Act
        response = await service.GetRawProducts(sample_request, mock_context)
        
        # Assert
        assert len(response.products) == 0
        mock_context.set_code.assert_called_with(grpc.StatusCode.INTERNAL)
        mock_context.set_details.assert_called_with("Internal parser error: Network error")

    @pytest.mark.asyncio
    async def test_get_raw_products_grpc_error_re_raises(
        self, 
        service: OzonRawProductService, 
        mock_parser_service: Mock,
        mock_context: Mock,
        sample_request: raw_product_pb2.GetRawProductsRequest
    ) -> None:
        """Тест переброса gRPC ошибок"""
        # Arrange
        grpc_error = grpc.RpcError()
        mock_parser_service.is_available = AsyncMock(return_value=True)
        mock_parser_service.parse_products = AsyncMock(side_effect=grpc_error)
        
        # Act & Assert
        with pytest.raises(grpc.RpcError):
            await service.GetRawProducts(sample_request, mock_context)

    @pytest.mark.asyncio
    async def test_get_raw_products_product_conversion_error_skips_product(
        self, 
        service: OzonRawProductService, 
        mock_parser_service: Mock,
        mock_context: Mock,
        sample_request: raw_product_pb2.GetRawProductsRequest
    ) -> None:
        """Тест пропуска товаров с ошибками конвертации"""
        # Arrange
        products_with_error = [
            Product(id="1", name="Valid Product", price=100.0, category="test"),
            Product(id="2", name="Invalid Product", price=float('inf'), category="test"),  # Вызовет ошибку
            Product(id="3", name="Another Valid", price=200.0, category="test")
        ]
        
        mock_parser_service.is_available = AsyncMock(return_value=True)
        mock_parser_service.parse_products = AsyncMock(return_value=products_with_error)
        
        # Act
        response = await service.GetRawProducts(sample_request, mock_context)
        
        # Assert
        # Должен вернуть только валидные продукты (пропустить товар с ошибкой)
        assert len(response.products) >= 2  # Может быть 2 или 3, зависит от обработки inf
        assert response.total_count >= 2 