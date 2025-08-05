#!/usr/bin/env python3
"""
Тест валидации размера запросов в Ozon API
"""
import asyncio
import grpc
import sys
import os

# Добавляем путь к src для импорта
sys.path.append(os.path.join(os.path.dirname(__file__), 'src'))

import raw_product_pb2
import raw_product_pb2_grpc


async def test_request_validation():
    """Тестирование валидации размера запросов"""
    
    # Подключаемся к gRPC серверу
    channel = grpc.aio.insecure_channel('localhost:3002')
    stub = raw_product_pb2_grpc.RawProductServiceStub(channel)
    
    # Тестовые данные
    test_token = os.getenv("OZON_API_TOKEN", "test_token")
    
    print("🧪 Тестирование валидации размера запросов...")
    
    # Тест 1: Нормальный запрос (должен пройти)
    print("\n1. Тест нормального запроса:")
    try:
        request = raw_product_pb2.GetRawProductsRequest(
            query="RTX 5070",
            category="videocards",
            auth_token=test_token
        )
        response = await stub.GetRawProducts(request)
        print(f"✅ Нормальный запрос прошел: {response.total_count} товаров")
    except grpc.RpcError as e:
        print(f"❌ Нормальный запрос не прошел: {e.details()}")
    
    # Тест 2: Слишком длинный query (должен быть отклонен)
    print("\n2. Тест слишком длинного query:")
    try:
        long_query = "A" * 101  # 101 символ
        request = raw_product_pb2.GetRawProductsRequest(
            query=long_query,
            category="videocards",
            auth_token=test_token
        )
        response = await stub.GetRawProducts(request)
        print(f"❌ Слишком длинный query прошел (не должен был): {response.total_count} товаров")
    except grpc.RpcError as e:
        if e.code() == grpc.StatusCode.INVALID_ARGUMENT:
            print(f"✅ Слишком длинный query правильно отклонен: {e.details()}")
        else:
            print(f"❌ Неожиданная ошибка: {e.code()} - {e.details()}")
    
    # Тест 3: Слишком длинная category (должна быть отклонена)
    print("\n3. Тест слишком длинной category:")
    try:
        long_category = "B" * 101  # 101 символ
        request = raw_product_pb2.GetRawProductsRequest(
            query="RTX 5070",
            category=long_category,
            auth_token=test_token
        )
        response = await stub.GetRawProducts(request)
        print(f"❌ Слишком длинная category прошла (не должна была): {response.total_count} товаров")
    except grpc.RpcError as e:
        if e.code() == grpc.StatusCode.INVALID_ARGUMENT:
            print(f"✅ Слишком длинная category правильно отклонена: {e.details()}")
        else:
            print(f"❌ Неожиданная ошибка: {e.code()} - {e.details()}")
    
    # Тест 4: Максимально допустимая длина (должна пройти)
    print("\n4. Тест максимально допустимой длины:")
    try:
        max_query = "C" * 100  # ровно 100 символов
        max_category = "D" * 100  # ровно 100 символов
        request = raw_product_pb2.GetRawProductsRequest(
            query=max_query,
            category=max_category,
            auth_token=test_token
        )
        response = await stub.GetRawProducts(request)
        print(f"✅ Максимальная длина прошла: {response.total_count} товаров")
    except grpc.RpcError as e:
        print(f"❌ Максимальная длина не прошла: {e.details()}")
    
    await channel.close()
    print("\n✅ Тестирование завершено!")


if __name__ == "__main__":
    asyncio.run(test_request_validation()) 