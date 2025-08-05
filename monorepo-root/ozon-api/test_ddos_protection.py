#!/usr/bin/env python3
"""
Тест DDoS защиты в Ozon API
"""
import asyncio
import grpc
import sys
import os
import time
import requests

# Добавляем путь к src для импорта
sys.path.append(os.path.join(os.path.dirname(__file__), 'src'))

import raw_product_pb2
import raw_product_pb2_grpc


async def test_ddos_protection():
    """Тестирование DDoS защиты"""
    
    # Подключаемся к gRPC серверу
    channel = grpc.aio.insecure_channel('localhost:3002')
    stub = raw_product_pb2_grpc.RawProductServiceStub(channel)
    
    # Тестовые данные
    test_token = "marketvision_secret_token_2024"
    
    print("🧪 Тестирование DDoS защиты...")
    
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
    
    # Тест 2: Burst атака (должна быть заблокирована)
    print("\n2. Тест burst атаки (10 запросов подряд):")
    blocked_count = 0
    for i in range(10):
        try:
            request = raw_product_pb2.GetRawProductsRequest(
                query=f"RTX 5070 {i}",
                category="videocards",
                auth_token=test_token
            )
            response = await stub.GetRawProducts(request)
            print(f"   Запрос {i+1}: прошел")
        except grpc.RpcError as e:
            if "DDoS protection" in e.details():
                blocked_count += 1
                print(f"   Запрос {i+1}: заблокирован - {e.details()}")
            else:
                print(f"   Запрос {i+1}: другая ошибка - {e.details()}")
    
    print(f"✅ Burst атака: заблокировано {blocked_count}/10 запросов")
    
    # Тест 3: Подозрительные паттерны (повторяющиеся запросы)
    print("\n3. Тест подозрительных паттернов:")
    try:
        for i in range(60):  # Много одинаковых запросов
            request = raw_product_pb2.GetRawProductsRequest(
                query="SUSPICIOUS_QUERY",  # Одинаковый запрос
                category="videocards",
                auth_token=test_token
            )
            response = await stub.GetRawProducts(request)
            if i % 10 == 0:
                print(f"   Запрос {i+1}: прошел")
    except grpc.RpcError as e:
        if "DDoS protection" in e.details():
            print(f"✅ Подозрительные паттерны заблокированы: {e.details()}")
        else:
            print(f"❌ Неожиданная ошибка: {e.details()}")
    
    # Тест 4: Неуспешные попытки аутентификации
    print("\n4. Тест неуспешных попыток аутентификации:")
    failed_auth_count = 0
    for i in range(15):  # Больше чем лимит
        try:
            request = raw_product_pb2.GetRawProductsRequest(
                query="RTX 5070",
                category="videocards",
                auth_token="wrong_token"  # Неправильный токен
            )
            response = await stub.GetRawProducts(request)
            print(f"   Попытка {i+1}: прошла (неожиданно)")
        except grpc.RpcError as e:
            if e.code() == grpc.StatusCode.UNAUTHENTICATED:
                failed_auth_count += 1
                print(f"   Попытка {i+1}: неуспешная аутентификация")
            elif "DDoS protection" in e.details():
                print(f"   Попытка {i+1}: заблокирована DDoS защитой - {e.details()}")
                break
            else:
                print(f"   Попытка {i+1}: другая ошибка - {e.details()}")
    
    print(f"✅ Неуспешные попытки аутентификации: {failed_auth_count}")
    
    # Тест 5: Проверка статистики DDoS защиты
    print("\n5. Тест статистики DDoS защиты:")
    try:
        headers = {
            'Authorization': f'Bearer {test_token}',
            'Accept': 'application/json'
        }
        response = requests.get('http://localhost:3005/ddos-stats', headers=headers)
        if response.status_code == 200:
            stats = response.json()
            print(f"✅ Статистика DDoS защиты:")
            print(f"   Всего запросов: {stats.get('total_requests', 0)}")
            print(f"   Заблокировано: {stats.get('blocked_requests', 0)}")
            print(f"   Процент блокировки: {stats.get('block_rate', 0):.2f}%")
            print(f"   IP в черном списке: {stats.get('blacklisted_ips', 0)}")
            print(f"   Подозрительные IP: {stats.get('suspicious_ips', 0)}")
        else:
            print(f"❌ Ошибка получения статистики: {response.status_code}")
    except Exception as e:
        print(f"❌ Ошибка запроса статистики: {e}")
    
    await channel.close()
    print("\n✅ Тестирование DDoS защиты завершено!")


if __name__ == "__main__":
    asyncio.run(test_ddos_protection()) 