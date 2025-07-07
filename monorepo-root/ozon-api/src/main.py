#!/usr/bin/env python3
"""
Ozon API gRPC сервер
Точка входа в приложение с правильной типизацией и обработкой ошибок
"""
import os
import asyncio
import signal
import sys
from typing import NoReturn

# Добавляем текущую директорию в путь для импортов
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Импорты для gRPC сервера
from infrastructure.grpc.ozon_grpc_service import serve


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
            loop.add_signal_handler(sig, lambda: asyncio.create_task(shutdown_handler()))
    else:
        # Windows
        signal.signal(signal.SIGINT, lambda s, f: asyncio.create_task(shutdown_handler()))


async def main() -> NoReturn:
    """
    Главная функция приложения
    
    Raises:
        SystemExit: При завершении приложения
    """
    print("🚀 Запуск Ozon API сервера...")
    
    try:
        setup_signal_handlers()
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