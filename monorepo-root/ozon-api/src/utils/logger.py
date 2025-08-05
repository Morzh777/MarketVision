#!/usr/bin/env python3
"""
Модуль для структурированного логирования в Ozon API
"""
import logging
import sys
from typing import Any, Dict


class ParserLogger:
    """Структурированный логгер для парсера"""
    
    def __init__(self, name: str) -> None:
        self.logger = logging.getLogger(name)
        self.logger.setLevel(logging.INFO)
        
        # Создаем handler если его нет
        if not self.logger.handlers:
            handler = logging.StreamHandler(sys.stdout)
            formatter = logging.Formatter(
                '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
            )
            handler.setFormatter(formatter)
            self.logger.addHandler(handler)
    
    def log_request_rejected(self, field: str, length: int, max_length: int, client_ip: str) -> None:
        """Логирование отклоненного запроса"""
        self.logger.warning(
            f"Запрос отклонен: {field} превышает лимит ({length} > {max_length}) от {client_ip}"
        )
    
    def log_parsing_start(self, query: str, category: str, client_ip: str) -> None:
        """Логирование начала парсинга"""
        self.logger.info(f"Начало парсинга: {query} в категории {category} от {client_ip}")
    
    def log_parsing_success(self, query: str, count: int, duration: int, client_ip: str) -> None:
        """Логирование успешного парсинга"""
        self.logger.info(f"Парсинг завершен: {query} -> {count} товаров за {duration}ms от {client_ip}")
    
    def log_parsing_error(self, query: str, error: Exception, client_ip: str) -> None:
        """Логирование ошибки парсинга"""
        self.logger.error(f"Ошибка парсинга: {query} -> {error} от {client_ip}")
    
    def log_grpc_request(self, method: str, request_data: Dict[str, Any], client_ip: str) -> None:
        """Логирование gRPC запроса"""
        self.logger.info(f"gRPC {method} от {client_ip}")
    
    def log_auth_success(self, client_ip: str) -> None:
        """Логирование успешной аутентификации"""
        self.logger.info(f"Аутентификация успешна от {client_ip}")
    
    def log_auth_failed(self, client_ip: str) -> None:
        """Логирование неуспешной аутентификации"""
        self.logger.warning(f"Аутентификация неуспешна от {client_ip}")
    
    def log_rate_limit_exceeded(self, client_ip: str, remaining: int) -> None:
        """Логирование превышения rate limit"""
        self.logger.warning(f"Rate limit превышен от {client_ip}, осталось запросов: {remaining}")


# Глобальный логгер для ozon-api
ozon_logger = ParserLogger("ozon-api") 