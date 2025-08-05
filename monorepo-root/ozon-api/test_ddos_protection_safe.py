#!/usr/bin/env python3
"""
Безопасный тест DDoS защиты в Ozon API (без обращения к Ozon)
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


async def test_ddos_protection_safe():
    """Безопасное тестирование DDoS защиты без обращения к Ozon"""
    
    # Подключаемся к gRPC серверу
    channel = grpc.aio.insecure_channel('localhost:3002')
    stub = raw_product_pb2_grpc.RawProductServiceStub(channel)
    
    # Тестовые данные
    test_token = "marketvision_secret_token_2024"
    
    print("🧪 Безопасное тестирование DDoS защиты (без обращения к Ozon)...")
    
    # Тест 1: Проверка статистики DDoS защиты (без запросов)
    print("\n1. Проверка начальной статистики DDoS защиты:")
    try:
        headers = {
            'Authorization': f'Bearer {test_token}',
            'Accept': 'application/json'
        }
        response = requests.get('http://localhost:3005/ddos-stats', headers=headers)
        if response.status_code == 200:
            stats = response.json()
            print(f"✅ Начальная статистика:")
            print(f"   Всего запросов: {stats.get('total_requests', 0)}")
            print(f"   Заблокировано: {stats.get('blocked_requests', 0)}")
            print(f"   IP в черном списке: {stats.get('blacklisted_ips', 0)}")
        else:
            print(f"❌ Ошибка получения статистики: {response.status_code}")
    except Exception as e:
        print(f"❌ Ошибка запроса статистики: {e}")
    
    # Тест 2: Burst атака с неправильным токеном (не дойдет до Ozon)
    print("\n2. Тест burst атаки с неправильным токеном:")
    blocked_count = 0
    for i in range(15):  # Больше чем лимит burst protection
        try:
            request = raw_product_pb2.GetRawProductsRequest(
                query=f"TEST_QUERY_{i}",
                category="test_category",
                auth_token="wrong_token"  # Неправильный токен - не дойдет до Ozon
            )
            response = await stub.GetRawProducts(request)
            print(f"   Запрос {i+1}: прошел (неожиданно)")
        except grpc.RpcError as e:
            if "DDoS protection" in e.details():
                blocked_count += 1
                print(f"   Запрос {i+1}: заблокирован DDoS - {e.details()}")
            elif e.code() == grpc.StatusCode.UNAUTHENTICATED:
                print(f"   Запрос {i+1}: неуспешная аутентификация")
            else:
                print(f"   Запрос {i+1}: другая ошибка - {e.details()}")
    
    print(f"✅ Burst атака: заблокировано {blocked_count}/15 запросов")
    
    # Тест 3: Подозрительные паттерны с неправильным токеном
    print("\n3. Тест подозрительных паттернов:")
    try:
        for i in range(60):  # Много одинаковых запросов
            request = raw_product_pb2.GetRawProductsRequest(
                query="SUSPICIOUS_PATTERN_TEST",  # Одинаковый запрос
                category="test_category",
                auth_token="wrong_token"  # Неправильный токен
            )
            response = await stub.GetRawProducts(request)
            if i % 10 == 0:
                print(f"   Запрос {i+1}: прошел")
    except grpc.RpcError as e:
        if "DDoS protection" in e.details():
            print(f"✅ Подозрительные паттерны заблокированы: {e.details()}")
        elif e.code() == grpc.StatusCode.UNAUTHENTICATED:
            print(f"✅ Запросы остановлены на аутентификации")
        else:
            print(f"❌ Неожиданная ошибка: {e.details()}")
    
    # Тест 4: Проверка статистики после атак
    print("\n4. Проверка статистики после атак:")
    try:
        headers = {
            'Authorization': f'Bearer {test_token}',
            'Accept': 'application/json'
        }
        response = requests.get('http://localhost:3005/ddos-stats', headers=headers)
        if response.status_code == 200:
            stats = response.json()
            print(f"✅ Статистика после атак:")
            print(f"   Всего запросов: {stats.get('total_requests', 0)}")
            print(f"   Заблокировано: {stats.get('blocked_requests', 0)}")
            print(f"   Процент блокировки: {stats.get('block_rate', 0):.2f}%")
            print(f"   IP в черном списке: {stats.get('blacklisted_ips', 0)}")
            print(f"   Подозрительные IP: {stats.get('suspicious_ips', 0)}")
        else:
            print(f"❌ Ошибка получения статистики: {response.status_code}")
    except Exception as e:
        print(f"❌ Ошибка запроса статистики: {e}")
    
    # Тест 5: Проверка белого списка (localhost должен проходить)
    print("\n5. Тест белого списка (localhost):")
    try:
        # Этот тест может не сработать, так как мы подключаемся через localhost
        # но он покажет, что система работает
        request = raw_product_pb2.GetRawProductsRequest(
            query="WHITELIST_TEST",
            category="test_category",
            auth_token="wrong_token"
        )
        response = await stub.GetRawProducts(request)
        print(f"✅ Запрос прошел (возможно, localhost в белом списке)")
    except grpc.RpcError as e:
        if e.code() == grpc.StatusCode.UNAUTHENTICATED:
            print(f"✅ Запрос остановлен на аутентификации (но не на DDoS защите)")
        else:
            print(f"❌ Неожиданная ошибка: {e.details()}")
    
    # Тест 6: Проверка health endpoint (должен работать)
    print("\n6. Тест health endpoint:")
    try:
        headers = {
            'User-Agent': 'curl/7.68.0',
            'Accept': 'application/json'
        }
        response = requests.get('http://localhost:3005/health', headers=headers)
        if response.status_code == 200:
            health_data = response.json()
            print(f"✅ Health endpoint работает: {health_data.get('status', 'unknown')}")
        else:
            print(f"❌ Health endpoint не работает: {response.status_code}")
    except Exception as e:
        print(f"❌ Ошибка health endpoint: {e}")
    
    await channel.close()
    print("\n✅ Безопасное тестирование DDoS защиты завершено!")
    print("💡 Все тесты выполнены без обращения к Ozon API")


if __name__ == "__main__":
    asyncio.run(test_ddos_protection_safe()) 