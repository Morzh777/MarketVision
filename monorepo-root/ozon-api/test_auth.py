#!/usr/bin/env python3
"""
Тест аутентификации Ozon API
"""
import grpc
import sys
import os

# Добавляем путь к proto файлам
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

import raw_product_pb2
import raw_product_pb2_grpc

def test_without_token():
    """Тест БЕЗ токена - должен вернуть UNAUTHENTICATED"""
    print("🔒 Тест БЕЗ токена...")
    
    with grpc.insecure_channel('localhost:3002') as channel:
        stub = raw_product_pb2_grpc.RawProductServiceStub(channel)
        
        # Запрос БЕЗ токена
        request = raw_product_pb2.GetRawProductsRequest(
            query="test",
            category="test"
        )
        
        try:
            response = stub.GetRawProducts(request)
            print("❌ ОШИБКА: Запрос прошел без токена!")
            return False
        except grpc.RpcError as e:
            if e.code() == grpc.StatusCode.UNAUTHENTICATED:
                print("✅ УСПЕХ: Получена ошибка UNAUTHENTICATED (как и должно быть)")
                return True
            else:
                print(f"❌ НЕОЖИДАННАЯ ОШИБКА: {e.code()} - {e.details()}")
                return False

def test_with_correct_token():
    """Тест С правильным токеном - должен работать"""
    print("\n🔑 Тест С правильным токеном...")
    
    with grpc.insecure_channel('localhost:3002') as channel:
        stub = raw_product_pb2_grpc.RawProductServiceStub(channel)
        
        # Запрос С правильным токеном
        request = raw_product_pb2.GetRawProductsRequest(
            query="iphone",
            category="iphone",
            auth_token="marketvision_secret_token_2024"
        )
        
        try:
            response = stub.GetRawProducts(request)
            print("✅ УСПЕХ: Запрос с токеном прошел!")
            print(f"📦 Получено товаров: {response.total_count}")
            return True
        except grpc.RpcError as e:
            print(f"❌ ОШИБКА: {e.code()} - {e.details()}")
            return False

def test_with_wrong_token():
    """Тест С неправильным токеном - должен вернуть UNAUTHENTICATED"""
    print("\n🚫 Тест С неправильным токеном...")
    
    with grpc.insecure_channel('localhost:3002') as channel:
        stub = raw_product_pb2_grpc.RawProductServiceStub(channel)
        
        # Запрос С неправильным токеном
        request = raw_product_pb2.GetRawProductsRequest(
            query="test",
            category="test",
            auth_token="wrong_token_123"
        )
        
        try:
            response = stub.GetRawProducts(request)
            print("❌ ОШИБКА: Запрос прошел с неправильным токеном!")
            return False
        except grpc.RpcError as e:
            if e.code() == grpc.StatusCode.UNAUTHENTICATED:
                print("✅ УСПЕХ: Получена ошибка UNAUTHENTICATED (как и должно быть)")
                return True
            else:
                print(f"❌ НЕОЖИДАННАЯ ОШИБКА: {e.code()} - {e.details()}")
                return False

if __name__ == "__main__":
    print("🧪 Тестирование аутентификации Ozon API")
    print("=" * 50)
    
    # Запускаем все тесты
    test1 = test_without_token()
    test2 = test_with_correct_token()
    test3 = test_with_wrong_token()
    
    print("\n" + "=" * 50)
    print("📊 РЕЗУЛЬТАТЫ ТЕСТИРОВАНИЯ:")
    print(f"Без токена: {'✅ ПРОШЕЛ' if test1 else '❌ ПРОВАЛЕН'}")
    print(f"С правильным токеном: {'✅ ПРОШЕЛ' if test2 else '❌ ПРОВАЛЕН'}")
    print(f"С неправильным токеном: {'✅ ПРОШЕЛ' if test3 else '❌ ПРОВАЛЕН'}")
    
    if test1 and test2 and test3:
        print("\n🎉 ВСЕ ТЕСТЫ ПРОШЛИ! Аутентификация работает корректно!")
    else:
        print("\n💥 ЕСТЬ ПРОБЛЕМЫ! Нужно исправить аутентификацию!") 