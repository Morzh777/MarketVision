#!/usr/bin/env python3
"""
Расширенный тест валидации размера запросов в Ozon API
"""
import asyncio
import grpc
import sys
import os

# Добавляем путь к src для импорта
sys.path.append(os.path.join(os.path.dirname(__file__), 'src'))

import raw_product_pb2
import raw_product_pb2_grpc


async def test_extended_validation():
    """Расширенное тестирование валидации размера запросов"""
    
    # Подключаемся к gRPC серверу
    channel = grpc.aio.insecure_channel('localhost:3002')
    stub = raw_product_pb2_grpc.RawProductServiceStub(channel)
    
    # Тестовые данные
    test_token = "marketvision_secret_token_2024"
    
    print("🧪 Расширенное тестирование валидации размера запросов...")
    
    # Тест 1: Слишком длинный platform_id
    print("\n1. Тест слишком длинного platform_id:")
    try:
        long_platform_id = "X" * 101  # 101 символ
        request = raw_product_pb2.GetRawProductsRequest(
            query="RTX 5070",
            category="videocards",
            platform_id=long_platform_id,
            auth_token=test_token
        )
        response = await stub.GetRawProducts(request)
        print(f"❌ Слишком длинный platform_id прошел (не должен был): {response.total_count} товаров")
    except grpc.RpcError as e:
        if e.code() == grpc.StatusCode.INVALID_ARGUMENT:
            print(f"✅ Слишком длинный platform_id правильно отклонен: {e.details()}")
        else:
            print(f"❌ Неожиданная ошибка: {e.code()} - {e.details()}")
    
    # Тест 2: Слишком длинный exactmodels
    print("\n2. Тест слишком длинного exactmodels:")
    try:
        long_exactmodels = "Y" * 101  # 101 символ
        request = raw_product_pb2.GetRawProductsRequest(
            query="RTX 5070",
            category="videocards",
            exactmodels=long_exactmodels,
            auth_token=test_token
        )
        response = await stub.GetRawProducts(request)
        print(f"❌ Слишком длинный exactmodels прошел (не должен был): {response.total_count} товаров")
    except grpc.RpcError as e:
        if e.code() == grpc.StatusCode.INVALID_ARGUMENT:
            print(f"✅ Слишком длинный exactmodels правильно отклонен: {e.details()}")
        else:
            print(f"❌ Неожиданная ошибка: {e.code()} - {e.details()}")
    
    # Тест 3: Все поля на максимальной длине
    print("\n3. Тест всех полей на максимальной длине:")
    try:
        max_query = "Q" * 100
        max_category = "C" * 100
        max_platform_id = "P" * 100
        max_exactmodels = "E" * 100
        
        request = raw_product_pb2.GetRawProductsRequest(
            query=max_query,
            category=max_category,
            platform_id=max_platform_id,
            exactmodels=max_exactmodels,
            auth_token=test_token
        )
        response = await stub.GetRawProducts(request)
        print(f"✅ Все поля на максимальной длине прошли: {response.total_count} товаров")
    except grpc.RpcError as e:
        print(f"❌ Все поля на максимальной длине не прошли: {e.details()}")
    
    # Тест 4: Пустые поля (должны быть отклонены)
    print("\n4. Тест пустых полей:")
    try:
        request = raw_product_pb2.GetRawProductsRequest(
            query="",
            category="videocards",
            auth_token=test_token
        )
        response = await stub.GetRawProducts(request)
        print(f"❌ Пустой query прошел (не должен был): {response.total_count} товаров")
    except grpc.RpcError as e:
        if e.code() == grpc.StatusCode.INVALID_ARGUMENT:
            print(f"✅ Пустой query правильно отклонен: {e.details()}")
        else:
            print(f"❌ Неожиданная ошибка: {e.code()} - {e.details()}")
    
    await channel.close()
    print("\n✅ Расширенное тестирование завершено!")


if __name__ == "__main__":
    asyncio.run(test_extended_validation()) 