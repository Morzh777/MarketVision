#!/usr/bin/env python3
"""
Быстрый тест DDoS защиты в Ozon API
"""
import requests
import time


def test_ddos_quick():
    """Быстрый тест DDoS защиты"""
    
    print("⚡ Быстрый тест DDoS защиты...")
    
    # Тест 1: Проверка health endpoint
    print("\n1. Проверка health endpoint:")
    try:
        headers = {'User-Agent': 'curl/7.68.0'}
        response = requests.get('http://localhost:3005/health', headers=headers)
        if response.status_code == 200:
            print(f"✅ Health endpoint работает")
        else:
            print(f"❌ Health endpoint не работает: {response.status_code}")
    except Exception as e:
        print(f"❌ Ошибка health endpoint: {e}")
        return
    
    # Тест 2: Проверка статистики DDoS защиты
    print("\n2. Проверка статистики DDoS защиты:")
    try:
        headers = {
            'Authorization': 'Bearer marketvision_secret_token_2024',
            'Accept': 'application/json'
        }
        response = requests.get('http://localhost:3005/ddos-stats', headers=headers)
        if response.status_code == 200:
            stats = response.json()
            print(f"✅ DDoS статистика:")
            print(f"   Всего запросов: {stats.get('total_requests', 0)}")
            print(f"   Заблокировано: {stats.get('blocked_requests', 0)}")
            print(f"   IP в черном списке: {stats.get('blacklisted_ips', 0)}")
        else:
            print(f"❌ Ошибка статистики: {response.status_code}")
    except Exception as e:
        print(f"❌ Ошибка запроса статистики: {e}")
    
    # Тест 3: Быстрая проверка burst защиты через HTTP
    print("\n3. Быстрая проверка burst защиты:")
    try:
        # Отправляем несколько быстрых запросов к health endpoint
        # (это не будет блокироваться, но покажет что система работает)
        start_time = time.time()
        for i in range(5):
            headers = {'User-Agent': 'curl/7.68.0'}
            response = requests.get('http://localhost:3005/health', headers=headers)
            if response.status_code == 200:
                print(f"   Запрос {i+1}: OK")
            else:
                print(f"   Запрос {i+1}: {response.status_code}")
        
        duration = time.time() - start_time
        print(f"✅ 5 запросов выполнено за {duration:.2f} секунд")
        
    except Exception as e:
        print(f"❌ Ошибка burst теста: {e}")
    
    print("\n✅ Быстрый тест завершен!")
    print("💡 Для полного тестирования запустите: python3 test_ddos_protection_safe.py")


if __name__ == "__main__":
    test_ddos_quick() 