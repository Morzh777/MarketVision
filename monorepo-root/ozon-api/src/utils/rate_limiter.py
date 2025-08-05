#!/usr/bin/env python3
"""
Система rate limiting для парсинга Ozon
"""
import asyncio
import time
from typing import Dict, Optional
from utils.logger import ozon_logger


class ParsingRateLimiter:
    """Rate limiter для парсинга с задержками между запросами"""
    
    def __init__(self):
        self.last_request_time: Dict[str, float] = {}
        self.min_delay_seconds = 1.0  # Минимальная задержка между запросами
        self.max_delay_seconds = 5.0  # Максимальная задержка при блокировке
        self.current_delay = self.min_delay_seconds
        self.consecutive_blocks = 0
        self.max_consecutive_blocks = 3
        
    async def wait_before_request(self, query: str) -> None:
        """Ждет перед выполнением запроса"""
        now = time.time()
        
        # Проверяем, прошло ли достаточно времени с последнего запроса
        if query in self.last_request_time:
            time_since_last = now - self.last_request_time[query]
            if time_since_last < self.current_delay:
                wait_time = self.current_delay - time_since_last
                ozon_logger.logger.info(f"⏳ Ожидание {wait_time:.1f}s перед запросом: {query}")
                await asyncio.sleep(wait_time)
        
        # Обновляем время последнего запроса
        self.last_request_time[query] = time.time()
    
    def on_request_success(self) -> None:
        """Вызывается при успешном запросе"""
        # Уменьшаем задержку при успешных запросах
        if self.consecutive_blocks > 0:
            self.consecutive_blocks = 0
            self.current_delay = max(self.min_delay_seconds, self.current_delay * 0.8)
            ozon_logger.logger.info(f"✅ Запрос успешен, уменьшаем задержку до {self.current_delay:.1f}s")
    
    def on_request_blocked(self) -> None:
        """Вызывается при блокировке запроса"""
        self.consecutive_blocks += 1
        
        # Увеличиваем задержку при блокировках
        if self.consecutive_blocks >= self.max_consecutive_blocks:
            self.current_delay = min(self.max_delay_seconds, self.current_delay * 1.5)
            ozon_logger.logger.warning(f"🚫 Запрос заблокирован, увеличиваем задержку до {self.current_delay:.1f}s")
            self.consecutive_blocks = 0  # Сбрасываем счетчик
    
    def get_current_delay(self) -> float:
        """Возвращает текущую задержку"""
        return self.current_delay
    
    def reset_delay(self) -> None:
        """Сбрасывает задержку к минимальному значению"""
        self.current_delay = self.min_delay_seconds
        self.consecutive_blocks = 0
        ozon_logger.logger.info(f"🔄 Сброс задержки к {self.min_delay_seconds}s")


# Глобальный экземпляр rate limiter
parsing_rate_limiter = ParsingRateLimiter() 