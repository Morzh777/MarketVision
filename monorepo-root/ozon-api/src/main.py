#!/usr/bin/env python3
"""
Ozon API gRPC сервер
Точка входа в приложение с правильной типизацией и обработкой ошибок
"""
import asyncio
import os
import signal
import sys
from typing import NoReturn
from aiohttp import web
import json

# Загружаем переменные окружения из .env файла
from dotenv import load_dotenv
load_dotenv()

# Добавляем текущую директорию в путь для импортов
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Импорты для gRPC сервера
from infrastructure.grpc.ozon_grpc_service import serve

# Импорт DDoS защиты (может быть недоступен при первом запуске)
try:
    from utils.ddos_protection import ddos_protection
    DDOS_AVAILABLE = True
except ImportError:
    DDOS_AVAILABLE = False
    print("⚠️ DDoS защита недоступна (utils.ddos_protection не найден)")


async def health_handler(request):
    """HTTP health check handler с CORS защитой"""
    # Проверяем Origin header для CORS защиты
    origin = request.headers.get('Origin')
    allowed_origins = [
        'http://localhost:3000',
        'http://localhost:3001', 
        'http://localhost:8080',
        'https://marketvision.local',
        'https://marketvision.com'
    ]
    
    # Если Origin не разрешен, отклоняем запрос
    if origin and origin not in allowed_origins:
        return web.json_response(
            {'error': 'CORS policy violation'}, 
            status=403
        )
    
    # Проверяем User-Agent для защиты от простых скриптов
    user_agent = request.headers.get('User-Agent', '')
    allowed_user_agents = ['curl', 'fetch', 'node', 'python', 'health', 'check']
    if not user_agent or not any(agent in user_agent.lower() for agent in allowed_user_agents):
        # Разрешаем curl, fetch, node, python и health check инструменты
        return web.json_response(
            {'error': 'Unauthorized client'}, 
            status=403
        )
    
    # Добавляем CORS headers для разрешенных источников
    headers = {
        'Access-Control-Allow-Origin': origin if origin in allowed_origins else '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Max-Age': '3600'
    }
    
    return web.json_response({
        'status': 'ok',
        'timestamp': asyncio.get_event_loop().time(),
        'service': 'ozon-api',
        'type': 'gRPC'
    }, headers=headers)


async def options_handler(request):
    """Обработчик OPTIONS запросов для CORS preflight"""
    origin = request.headers.get('Origin')
    allowed_origins = [
        'http://localhost:3000',
        'http://localhost:3001', 
        'http://localhost:8080',
        'https://marketvision.local',
        'https://marketvision.com'
    ]
    
    headers = {
        'Access-Control-Allow-Origin': origin if origin in allowed_origins else '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Max-Age': '3600'
    }
    
    return web.Response(headers=headers)


async def ddos_stats_handler(request):
    """HTTP handler для статистики DDoS защиты"""
    # Проверяем аутентификацию для доступа к статистике
    auth_header = request.headers.get('Authorization', '')
    expected_token = os.getenv("OZON_API_TOKEN", "")
    
    if not auth_header.startswith('Bearer ') or auth_header[7:] != expected_token:
        return web.json_response(
            {'error': 'Unauthorized'}, 
            status=401
        )
    
    # Проверяем доступность DDoS защиты
    if not DDOS_AVAILABLE:
        return web.json_response(
            {'error': 'DDoS protection not available'}, 
            status=503
        )
    
    # Получаем статистику
    stats = ddos_protection.get_statistics()
    
    # Добавляем CORS headers
    headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Max-Age': '3600'
    }
    
    return web.json_response(stats, headers=headers)


async def start_http_server():
    """Запуск HTTP сервера для health checks с CORS защитой"""
    app = web.Application()
    
    # Добавляем CORS middleware
    @web.middleware
    async def cors_middleware(request, handler):
        """CORS middleware для всех запросов"""
        response = await handler(request)
        
        # Добавляем security headers
        response.headers['X-Content-Type-Options'] = 'nosniff'
        response.headers['X-Frame-Options'] = 'DENY'
        response.headers['X-XSS-Protection'] = '1; mode=block'
        response.headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains'
        
        return response
    
    app.middlewares.append(cors_middleware)
    
    # Добавляем роуты
    app.router.add_get('/health', health_handler)
    app.router.add_options('/health', options_handler)
    app.router.add_get('/ddos-stats', ddos_stats_handler)
    
    runner = web.AppRunner(app)
    await runner.setup()
    site = web.TCPSite(runner, '0.0.0.0', 3005)
    await site.start()
    print("🌐 HTTP сервер запущен на 0.0.0.0:3005 (для health checks с CORS защитой)")


async def shutdown_handler() -> None:
    """Обработчик graceful shutdown"""
    print("🛑 Получен сигнал завершения...")
    # Здесь можно добавить логику закрытия ресурсов
    sys.exit(0)


def setup_signal_handlers() -> None:
    """Настройка обработчиков сигналов"""
    if sys.platform != "win32":
        # Unix-подобные системы
        loop = asyncio.get_event_loop()
        for sig in (signal.SIGTERM, signal.SIGINT):
            loop.add_signal_handler(
                sig, lambda: asyncio.create_task(shutdown_handler())
            )
    else:
        # Windows
        signal.signal(
            signal.SIGINT, lambda s, f: asyncio.create_task(shutdown_handler())
        )


async def main() -> NoReturn:
    """
    Главная функция приложения

    Raises:
        SystemExit: При завершении приложения
    """
    # Принудительная очистка буфера для Docker
    import sys
    sys.stdout.flush()
    sys.stderr.flush()
    
    print("🚀 Запуск Ozon API сервера...")
    print(f"🔑 OZON_API_TOKEN из env: {os.getenv('OZON_API_TOKEN', 'НЕ НАЙДЕН')}")
    sys.stdout.flush()

    try:
        setup_signal_handlers()
        
        # Запускаем HTTP сервер для health checks
        await start_http_server()
        
        # Запускаем gRPC сервер
        await serve()
    except KeyboardInterrupt:
        print("🛑 Прерывание по Ctrl+C")
    except Exception as e:
        print(f"❌ Критическая ошибка: {e}")
        sys.exit(1)
    finally:
        print("✅ Ozon API сервер завершен")


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("🛑 Принудительное завершение")
        sys.exit(0)
