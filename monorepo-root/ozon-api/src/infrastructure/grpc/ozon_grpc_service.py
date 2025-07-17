import asyncio
from concurrent.futures import ThreadPoolExecutor
from typing import Any, Dict, Optional

import grpc

import raw_product_pb2
import raw_product_pb2_grpc
from infrastructure.services.ozon_parser_service import OzonParserService


class OzonRawProductService(raw_product_pb2_grpc.RawProductServiceServicer):
    """gRPC сервис для Ozon API с типизацией и обработкой ошибок"""

    def __init__(self) -> None:
        self.parser_service = OzonParserService()

    async def GetRawProducts(
        self,
        request: raw_product_pb2.GetRawProductsRequest,
        context: grpc.ServicerContext,
    ) -> raw_product_pb2.GetRawProductsResponse:
        """
        Получает сырые данные товаров с Ozon

        Args:
            request: gRPC запрос с query, category и platform_id
            context: gRPC context для обработки ошибок

        Returns:
            GetRawProductsResponse с массивом товаров

        Raises:
            grpc.RpcError: При ошибках парсинга или валидации
        """
        query = request.query
        category = request.category
        platform_id: Optional[str] = getattr(request, "platform_id", None)
        if not platform_id:
            platform_id = None
        exactmodels: Optional[str] = getattr(request, "exactmodels", None)
        if not exactmodels:
            exactmodels = None

        # Валидация входных данных
        if not query or not query.strip():
            context.set_code(grpc.StatusCode.INVALID_ARGUMENT)
            context.set_details("Query cannot be empty")
            return raw_product_pb2.GetRawProductsResponse(
                products=[], total_count=0, source="ozon"
            )

        if not category or not category.strip():
            context.set_code(grpc.StatusCode.INVALID_ARGUMENT)
            context.set_details("Category cannot be empty")
            return raw_product_pb2.GetRawProductsResponse(
                products=[], total_count=0, source="ozon"
            )

        print(f"🔍 gRPC GetRawProducts запрос: {query} в категории {category}")
        if platform_id:
            print(f"🎮 С платформой: {platform_id}")

        try:
            # Проверяем доступность парсера
            if not await self.parser_service.is_available():
                context.set_code(grpc.StatusCode.UNAVAILABLE)
                context.set_details("Parser service is currently unavailable")
                return raw_product_pb2.GetRawProductsResponse(
                    products=[], total_count=0, source="ozon"
                )

            products = await self.parser_service.parse_products(
                query, category, platform_id, exactmodels
            )
            grpc_products = []

            for product in products:
                try:
                    grpc_product = raw_product_pb2.RawProduct(
                        id=product.id,
                        name=product.name,
                        price=int(product.price),
                        image_url=product.image_url or "",
                        product_url=product.product_url or "",
                        category=category,
                        source="ozon",
                        query=query,
                    )
                    grpc_products.append(grpc_product)
                except (ValueError, TypeError, OverflowError) as e:
                    print(f"⚠️ Ошибка конвертации товара {product.id}: {e}")
                    continue

            print(f"✅ Успешно обработано {len(grpc_products)} товаров")
            return raw_product_pb2.GetRawProductsResponse(
                products=grpc_products, total_count=len(grpc_products), source="ozon"
            )

        except grpc.RpcError:
            # Переброс gRPC ошибок как есть
            raise
        except Exception as e:
            print(f"❌ Внутренняя ошибка в gRPC GetRawProducts: {e}")
            context.set_code(grpc.StatusCode.INTERNAL)
            context.set_details(f"Internal parser error: {str(e)}")
            return raw_product_pb2.GetRawProductsResponse(
                products=[], total_count=0, source="ozon"
            )


async def serve() -> None:
    """Запуск gRPC сервера с правильной обработкой жизненного цикла"""
    server = grpc.aio.server(ThreadPoolExecutor(max_workers=10))
    raw_product_pb2_grpc.add_RawProductServiceServicer_to_server(
        OzonRawProductService(), server
    )
    listen_addr = "[::]:3002"
    server.add_insecure_port(listen_addr)

    print(f"🚀 Ozon API gRPC сервер (raw-product.proto) запущен на {listen_addr}")

    try:
        await server.start()
        await server.wait_for_termination()
    except KeyboardInterrupt:
        print("🛑 Получен сигнал прерывания, завершаем сервер...")
    finally:
        print("🔄 Graceful shutdown...")
        await server.stop(grace=5)
        print("✅ Сервер завершен")


if __name__ == "__main__":
    asyncio.run(serve())
