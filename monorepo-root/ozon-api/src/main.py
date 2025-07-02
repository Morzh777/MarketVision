import asyncio
import signal
import sys
import os

# Добавляем текущую директорию в путь для импортов
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Импорты для gRPC сервера
from infrastructure.grpc.ozon_grpc_service import serve

class OzonApiApplication:
    """Главное приложение Ozon API (gRPC сервер) - ТОЛЬКО ПАРСИНГ!"""
    
    def __init__(self):
        # Обработчики сигналов для graceful shutdown
        signal.signal(signal.SIGINT, self._signal_handler)
        signal.signal(signal.SIGTERM, self._signal_handler)
    
    def _signal_handler(self, signum, frame):
        """Обработчик сигналов для корректного завершения"""
        print(f"\n🛑 Получен сигнал {signum}, завершаем работу...")
        sys.exit(0)
    
    def startup(self):
        """Запуск приложения"""
        print("🚀 Запуск Ozon API gRPC сервера на порту 3002...")
        
        try:
            print("✅ Ozon API gRPC сервер успешно запущен")
            print("🔗 Готов принимать запросы от Product-Filter-Service")
            print("📡 gRPC сервер: localhost:3002")
            print("📡 Готов к парсингу (БЕЗ ФИЛЬТРАЦИИ И КЭШИРОВАНИЯ)")
            
        except Exception as e:
            print(f"❌ Ошибка запуска: {e}")
            sys.exit(1)
    
    def shutdown(self):
        """Завершение работы приложения"""
        print("🛑 Завершение работы Ozon API gRPC сервера...")
        print("✅ Ozon API корректно завершен")
    
    def run(self):
        """Запуск и ожидание завершения"""
        self.startup()
        
        try:
            # Запускаем gRPC сервер
            asyncio.run(serve())
            
        except KeyboardInterrupt:
            print("\n🛑 Получен сигнал прерывания")
        finally:
            self.shutdown()

def main():
    """Точка входа"""
    app = OzonApiApplication()
    app.run()

if __name__ == "__main__":
    main() 