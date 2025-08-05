#!/usr/bin/env python3
"""
Тест CORS защиты health endpoint в Ozon API
"""
import requests
import json


def test_cors_protection():
    """Тестирование CORS защиты health endpoint"""
    
    base_url = "http://localhost:3005"
    
    print("🧪 Тестирование CORS защиты health endpoint...")
    
    # Тест 1: Нормальный запрос с curl User-Agent (должен пройти)
    print("\n1. Тест нормального запроса с curl:")
    try:
        headers = {
            'User-Agent': 'curl/7.68.0',
            'Accept': 'application/json'
        }
        response = requests.get(f"{base_url}/health", headers=headers)
        print(f"✅ Нормальный запрос прошел: {response.status_code}")
        print(f"   Ответ: {response.json()}")
    except Exception as e:
        print(f"❌ Нормальный запрос не прошел: {e}")
    
    # Тест 2: Запрос с неразрешенным Origin (должен быть отклонен)
    print("\n2. Тест с неразрешенным Origin:")
    try:
        headers = {
            'User-Agent': 'curl/7.68.0',
            'Origin': 'https://malicious-site.com',
            'Accept': 'application/json'
        }
        response = requests.get(f"{base_url}/health", headers=headers)
        if response.status_code == 403:
            print(f"✅ Запрос с неразрешенным Origin правильно отклонен: {response.status_code}")
            print(f"   Ответ: {response.json()}")
        else:
            print(f"❌ Запрос с неразрешенным Origin прошел (не должен был): {response.status_code}")
    except Exception as e:
        print(f"❌ Ошибка теста: {e}")
    
    # Тест 3: Запрос с разрешенным Origin (должен пройти)
    print("\n3. Тест с разрешенным Origin:")
    try:
        headers = {
            'User-Agent': 'curl/7.68.0',
            'Origin': 'http://localhost:3000',
            'Accept': 'application/json'
        }
        response = requests.get(f"{base_url}/health", headers=headers)
        print(f"✅ Запрос с разрешенным Origin прошел: {response.status_code}")
        print(f"   CORS headers: {dict(response.headers)}")
    except Exception as e:
        print(f"❌ Ошибка теста: {e}")
    
    # Тест 4: Запрос без User-Agent (должен быть отклонен)
    print("\n4. Тест без User-Agent:")
    try:
        headers = {
            'Accept': 'application/json'
        }
        response = requests.get(f"{base_url}/health", headers=headers)
        if response.status_code == 403:
            print(f"✅ Запрос без User-Agent правильно отклонен: {response.status_code}")
            print(f"   Ответ: {response.json()}")
        else:
            print(f"❌ Запрос без User-Agent прошел (не должен был): {response.status_code}")
    except Exception as e:
        print(f"❌ Ошибка теста: {e}")
    
    # Тест 5: OPTIONS запрос (CORS preflight)
    print("\n5. Тест OPTIONS запроса:")
    try:
        headers = {
            'Origin': 'http://localhost:3000',
            'Access-Control-Request-Method': 'GET',
            'Access-Control-Request-Headers': 'Content-Type'
        }
        response = requests.options(f"{base_url}/health", headers=headers)
        print(f"✅ OPTIONS запрос прошел: {response.status_code}")
        print(f"   CORS headers: {dict(response.headers)}")
    except Exception as e:
        print(f"❌ Ошибка теста: {e}")
    
    # Тест 6: Проверка security headers
    print("\n6. Тест security headers:")
    try:
        headers = {
            'User-Agent': 'curl/7.68.0',
            'Accept': 'application/json'
        }
        response = requests.get(f"{base_url}/health", headers=headers)
        
        security_headers = {
            'X-Content-Type-Options': response.headers.get('X-Content-Type-Options'),
            'X-Frame-Options': response.headers.get('X-Frame-Options'),
            'X-XSS-Protection': response.headers.get('X-XSS-Protection'),
            'Strict-Transport-Security': response.headers.get('Strict-Transport-Security')
        }
        
        print(f"✅ Security headers: {security_headers}")
        
        # Проверяем наличие всех security headers
        missing_headers = [k for k, v in security_headers.items() if not v]
        if missing_headers:
            print(f"⚠️ Отсутствуют security headers: {missing_headers}")
        else:
            print("✅ Все security headers присутствуют")
            
    except Exception as e:
        print(f"❌ Ошибка теста: {e}")
    
    print("\n✅ Тестирование CORS защиты завершено!")


if __name__ == "__main__":
    test_cors_protection() 