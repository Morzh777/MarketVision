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


async def health_handler(request):
    """HTTP health check handler"""
    return web.json_response({
        'status': 'ok',
        'timestamp': asyncio.get_event_loop().time(),
        'service': 'ozon-api',
        'type': 'gRPC'
    })


async def start_http_server():
    """Запуск HTTP сервера для health checks"""
    app = web.Application()
    app.router.add_get('/health', health_handler)
    
    runner = web.AppRunner(app)
    await runner.setup()
    site = web.TCPSite(runner, '0.0.0.0', 3005)
    await site.start()
    print("🌐 HTTP сервер запущен на 0.0.0.0:3005 (для health checks)")


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
