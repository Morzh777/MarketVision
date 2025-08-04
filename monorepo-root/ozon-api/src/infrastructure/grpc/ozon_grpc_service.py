import asyncio
import os
import time
from collections import defaultdict
from concurrent.futures import ThreadPoolExecutor
from typing import Any, Dict, Optional

import grpc

import raw_product_pb2
import raw_product_pb2_grpc
from infrastructure.services.ozon_parser_service import OzonParserService


class RateLimiter:
    """Простой rate limiter для защиты от спама"""
    
    def __init__(self, max_requests: int = 10, window_seconds: int = 60):
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self.requests = defaultdict(list)
    
    def is_allowed(self, client_id: str) -> bool:
        """Проверяет, разрешен ли запрос от клиента"""
        now = time.time()
        
        # Удаляем старые запросы
        self.requests[client_id] = [
            req_time for req_time in self.requests[client_id] 
            if now - req_time < self.window_seconds
        ]
        
        # Проверяем лимит
        if len(self.requests[client_id]) >= self.max_requests:
            return False
        
        # Добавляем текущий запрос
        self.requests[client_id].append(now)
        return True
    
    def get_remaining_requests(self, client_id: str) -> int:
        """Возвращает количество оставшихся запросов"""
        now = time.time()
        self.requests[client_id] = [
            req_time for req_time in self.requests[client_id] 
            if now - req_time < self.window_seconds
        ]
        return max(0, self.max_requests - len(self.requests[client_id]))


class OzonRawProductService(raw_product_pb2_grpc.RawProductServiceServicer):
    """gRPC сервис для Ozon API с типизацией и обработкой ошибок"""

    def __init__(self) -> None:
        self.parser_service = OzonParserService()
        # Rate limiter: 200 запросов в минуту на клиента
        self.rate_limiter = RateLimiter(max_requests=200, window_seconds=60)

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
        # Получаем IP клиента для rate limiting
        client_ip = context.peer().split(':')[0] if context.peer() else 'unknown'
        
        # Проверяем rate limiting
        if not self.rate_limiter.is_allowed(client_ip):
            remaining = self.rate_limiter.get_remaining_requests(client_ip)
            context.set_code(grpc.StatusCode.RESOURCE_EXHAUSTED)
            context.set_details(f"Rate limit exceeded. Try again later. Remaining requests: {remaining}")
            return raw_product_pb2.GetRawProductsResponse(
                products=[], total_count=0, source="ozon"
            )
        
        query = request.query
        category = request.category
        
        # Проверка аутентификации
        auth_token = getattr(request, "auth_token", "")
        expected_token = os.getenv("OZON_API_TOKEN")
        
        print(f"🔍 Получен запрос: query='{query}', category='{category}' от {client_ip}")
        print(f"🔑 Аутентификация: {'успешна' if auth_token == expected_token else 'неуспешна'}")
        
        if not expected_token:
            print("❌ ОШИБКА: OZON_API_TOKEN environment variable is not set")
            context.set_code(grpc.StatusCode.INTERNAL)
            context.set_details("Server configuration error: OZON_API_TOKEN not set")
            return raw_product_pb2.GetRawProductsResponse(
                products=[], total_count=0, source="ozon"
            )
        
        if not auth_token or auth_token != expected_token:
            context.set_code(grpc.StatusCode.UNAUTHENTICATED)
            context.set_details("Invalid or missing authentication token")
            return raw_product_pb2.GetRawProductsResponse(
                products=[], total_count=0, source="ozon"
            )
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
            
            # Специальная обработка для ошибок драйвера
            if "no such window" in str(e) or "target window already closed" in str(e):
                print("🔄 Ошибка драйвера, но драйвер остается открытым для следующих запросов")
                print("ℹ️ Следующий запрос попробует использовать существующий драйвер")
            
            context.set_code(grpc.StatusCode.INTERNAL)
            context.set_details(f"Internal parser error: {str(e)}")
            return raw_product_pb2.GetRawProductsResponse(
                products=[], total_count=0, source="ozon"
            )


async def serve() -> None:
    """Запуск gRPC сервера с правильной обработкой жизненного цикла"""
    server = grpc.aio.server(ThreadPoolExecutor(max_workers=10))
    ozon_service = OzonRawProductService()
    raw_product_pb2_grpc.add_RawProductServiceServicer_to_server(
        ozon_service, server
    )
    listen_addr = "[::]:3002"
    server.add_insecure_port(listen_addr)

    print(f"🚀 Ozon API gRPC сервер (raw-product.proto) запущен на {listen_addr}")
    import sys
    sys.stdout.flush()

    try:
        await server.start()
        await server.wait_for_termination()
    except KeyboardInterrupt:
        print("🛑 Получен сигнал прерывания, завершаем сервер...")
    finally:
        print("🔄 Graceful shutdown...")
        # Принудительно закрываем браузер при завершении сервиса
        try:
            await ozon_service.parser_service.close(force=True)
            print("🔌 Браузер принудительно закрыт")
        except Exception as e:
            print(f"⚠️ Ошибка при закрытии браузера: {e}")
        await server.stop(grace=5)
        print("✅ Сервер завершен")


if __name__ == "__main__":
    asyncio.run(serve())
