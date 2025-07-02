#!/usr/bin/env python3
"""
Тест-клиент для проверки работы Ozon API gRPC сервера
Имитирует Product-Filter-Service
"""

import asyncio
import grpc
import sys
import os
import time

# Добавляем путь к src для импорта
sys.path.append(os.path.join(os.path.dirname(__file__), 'src'))

# Импортируем сгенерированные gRPC файлы
import product_pb2
import product_pb2_grpc

class TestGrpcClient:
    """Тест-клиент для Ozon API"""
    
    def __init__(self, server_address: str = "localhost:3002"):
        self.server_address = server_address
        self.channel = None
        self.stub = None
    
    async def connect(self):
        """Подключиться к gRPC серверу"""
        try:
            print(f"🔗 Подключение к {self.server_address}...")
            connect_start = time.time()
            self.channel = grpc.aio.insecure_channel(self.server_address)
            self.stub = product_pb2_grpc.ProductFilterServiceStub(self.channel)
            connect_time = (time.time() - connect_start) * 1000
            print(f"✅ Подключение установлено за {round(connect_time, 2)}ms")
            return True
        except Exception as e:
            print(f"❌ Ошибка подключения: {e}")
            return False
    
    async def test_filter_products(self, query: str = "rtx 5080"):
        """Тест фильтрации продуктов"""
        try:
            print(f"\n🧪 Тестируем фильтрацию продуктов: '{query}'")
            
            # Создаем запрос
            request = product_pb2.FilterProductsRequest(
                products=[],  # Пустой список, Ozon API сам парсит
                query=query,
                all_queries=[query],
                exclude_keywords=[],
                source="ozon",
                category="videocards"
            )
            
            # Отправляем запрос
            print("📡 Отправляем gRPC запрос...")
            start_time = time.time()
            response = await self.stub.FilterProducts(request)
            end_time = time.time()
            
            # Анализируем ответ
            print(f"📊 Ответ получен:")
            print(f"   - Всего товаров: {response.total_input}")
            print(f"   - Отфильтровано: {response.total_filtered}")
            print(f"   - Время обработки: {round((end_time - start_time) * 1000, 3)}ms")
            print(f"   - Товаров в ответе: {len(response.products)}")
            
            # Показываем первые товары
            if response.products:
                print(f"\n🛍️ Первые товары:")
                for i, product in enumerate(response.products[:3], 1):
                    print(f"   {i}. {product.name}")
                    print(f"      Цена: {product.price} ₽")
                    print(f"      ID: {product.id}")
                    print(f"      URL: {product.product_url}")
                    print(f"      Изображение: {product.image_url}")
                    print(f"      Категория: {product.category}")
                    print(f"      Наличие: {product.availability}")
                    print(f"      Характеристики: {product.characteristics}")
                    print()
            else:
                print("❌ Товары не найдены")
            
            return response
            
        except Exception as e:
            print(f"❌ Ошибка тестирования: {e}")
            return None
    
    async def close(self):
        """Закрыть соединение"""
        if self.channel:
            await self.channel.close()
            print("🔌 Соединение закрыто")

async def main():
    """Главная функция тестирования"""
    print("🚀 Запуск тест-клиента для Ozon API gRPC сервера")
    print("=" * 60)
    
    client = TestGrpcClient()
    
    try:
        # Подключаемся к серверу
        if not await client.connect():
            return
        
        # Тестируем разные запросы
        queries = [
            "rtx 5080",      # Видеокарты
            "rtx 5090",      # Видеокарты  
            "rtx 5070ti",    # Видеокарты
            "7800x3d",       # Процессоры
            "9800x3d",       # Процессоры
            "9950x"          # Процессоры
        ]
        total_start_time = time.time()
        response_times = []
        
        for i, query in enumerate(queries, 1):
            print(f"\n{'='*20} ЗАПРОС {i}/{len(queries)} {'='*20}")
            query_start = time.time()
            
            response = await client.test_filter_products(query)
            
            query_time = (time.time() - query_start) * 1000
            response_times.append(query_time)
            
            print(f"⏱️ Время запроса '{query}': {round(query_time, 2)}ms")
            
            if i < len(queries):
                print("⏳ Пауза 2 секунды...")
                await asyncio.sleep(2)
        
        # Общая статистика
        total_time = (time.time() - total_start_time) * 1000
        avg_time = sum(response_times) / len(response_times)
        min_time = min(response_times)
        max_time = max(response_times)
        
        print(f"\n{'='*20} СТАТИСТИКА ВРЕМЕНИ {'='*20}")
        print(f"📊 Общее время тестирования: {round(total_time, 2)}ms")
        print(f"📊 Среднее время запроса: {round(avg_time, 2)}ms")
        print(f"📊 Минимальное время: {round(min_time, 2)}ms")
        print(f"📊 Максимальное время: {round(max_time, 2)}ms")
        print(f"📊 Количество запросов: {len(queries)}")
        
        # Прогноз на 100 запросов
        time_100_requests = avg_time * 100
        time_100_requests_seconds = time_100_requests / 1000
        
        print(f"\n{'='*20} ПРОГНОЗ НА 100 ЗАПРОСОВ {'='*20}")
        print(f"📊 Среднее время на 1 запрос: {round(avg_time, 2)}ms")
        print(f"📊 Время на 100 запросов: {round(time_100_requests, 2)}ms ({round(time_100_requests_seconds, 2)} сек)")
        print(f"📊 Запросов в секунду: {round(1000 / avg_time, 2)}")
        print(f"📊 Запросов в минуту: {round(60000 / avg_time, 2)}")
        
        # Рекомендации по производительности
        print(f"\n{'='*20} РЕКОМЕНДАЦИИ {'='*20}")
        if avg_time < 5000:
            print("✅ Отличная производительность! Время запроса менее 5 секунд")
        elif avg_time < 10000:
            print("⚠️ Хорошая производительность. Время запроса 5-10 секунд")
        else:
            print("❌ Медленная производительность. Время запроса более 10 секунд")
        
        if time_100_requests_seconds < 300:  # 5 минут
            print("✅ 100 запросов займут менее 5 минут")
        elif time_100_requests_seconds < 600:  # 10 минут
            print("⚠️ 100 запросов займут 5-10 минут")
        else:
            print("❌ 100 запросов займут более 10 минут")
        
        print("\n" + "="*60)
        print("🎯 ФИНАЛЬНАЯ СВОДКА ТЕСТИРОВАНИЯ")
        print("="*60)
        print(f"📊 Протестировано запросов: {len(queries)}")
        print(f"📊 Среднее время запроса: {round(avg_time, 2)}ms")
        print(f"📊 Общее время тестирования: {round(total_time, 2)}ms")
        print(f"📊 Прогноз на 100 запросов: {round(time_100_requests_seconds, 2)} сек")
        print(f"📊 Пропускная способность: {round(1000 / avg_time, 2)} запр/сек")
        print("="*60)
        print("✅ Все тесты завершены!")
        
    except KeyboardInterrupt:
        print("\n🛑 Тестирование прервано пользователем")
    except Exception as e:
        print(f"\n❌ Ошибка тестирования: {e}")
    finally:
        await client.close()

if __name__ == "__main__":
    asyncio.run(main()) 