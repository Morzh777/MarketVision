import asyncio
import grpc
from concurrent.futures import ThreadPoolExecutor
from infrastructure.services.ozon_parser_service import OzonParserService

import raw_product_pb2
import raw_product_pb2_grpc

class OzonRawProductService(raw_product_pb2_grpc.RawProductServiceServicer):
    """gRPC сервис для Ozon API по новому контракту"""
    def __init__(self):
        self.parser_service = OzonParserService()

    async def GetRawProducts(self, request, context):
        query = request.query
        category = request.category
        print(f"🔍 gRPC GetRawProducts запрос: {query} в категории {category}")
        try:
            products = await self.parser_service.parse_products(query, category)
            grpc_products = []
            for product in products:
                grpc_product = raw_product_pb2.RawProduct(
                    id=product.id,
                    name=product.name,
                    price=int(product.price),
                    image_url=product.image_url or "",
                    product_url=product.product_url or "",
                    category=category,
                    source="ozon",
                    query=query  # Добавляем query к каждому товару
                )
                grpc_products.append(grpc_product)
            return raw_product_pb2.GetRawProductsResponse(
                products=grpc_products,
                total_count=len(grpc_products),
                source="ozon"
            )
        except Exception as e:
            print(f"❌ Ошибка в gRPC GetRawProducts: {e}")
            context.set_code(grpc.StatusCode.INTERNAL)
            context.set_details(f"Internal error: {str(e)}")
            return raw_product_pb2.GetRawProductsResponse(
                products=[],
                total_count=0,
                source="ozon"
            )

async def serve():
    server = grpc.aio.server(ThreadPoolExecutor(max_workers=10))
    raw_product_pb2_grpc.add_RawProductServiceServicer_to_server(OzonRawProductService(), server)
    listen_addr = '[::]:3002'
    server.add_insecure_port(listen_addr)
    print(f"🚀 Ozon API gRPC сервер (raw-product.proto) запущен на {listen_addr}")
    await server.start()
    await server.wait_for_termination()

if __name__ == "__main__":
    asyncio.run(serve()) 