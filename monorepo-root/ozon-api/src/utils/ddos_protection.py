#!/usr/bin/env python3
"""
Продвинутая система защиты от DDoS атак для Ozon API
"""
import time
import asyncio
from collections import defaultdict, deque
from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass
from utils.logger import ozon_logger


@dataclass
class DDoSConfig:
    """Конфигурация DDoS защиты"""
    # Rate limiting
    max_requests_per_minute: int = 200
    max_requests_per_hour: int = 1000
    max_requests_per_day: int = 5000
    
    # Burst protection
    max_burst_requests: int = 10
    burst_window_seconds: int = 5
    
    # Suspicious activity detection
    max_concurrent_connections: int = 5
    suspicious_pattern_threshold: int = 50
    
    # Blacklist
    blacklist_duration_hours: int = 24
    max_failed_auth_attempts: int = 10
    
    # Whitelist
    whitelisted_ips: List[str] = None
    
    def __post_init__(self):
        if self.whitelisted_ips is None:
            self.whitelisted_ips = ['127.0.0.1', '::1', 'localhost']


class AdvancedDDoSProtection:
    """Продвинутая система защиты от DDoS атак"""
    
    def __init__(self, config: DDoSConfig):
        self.config = config
        
        # Rate limiting storage
        self.minute_requests: Dict[str, deque] = defaultdict(lambda: deque(maxlen=config.max_requests_per_minute))
        self.hour_requests: Dict[str, deque] = defaultdict(lambda: deque(maxlen=config.max_requests_per_hour))
        self.day_requests: Dict[str, deque] = defaultdict(lambda: deque(maxlen=config.max_requests_per_day))
        
        # Burst protection
        self.burst_requests: Dict[str, deque] = defaultdict(lambda: deque(maxlen=config.max_burst_requests))
        
        # Connection tracking
        self.active_connections: Dict[str, int] = defaultdict(int)
        self.connection_timestamps: Dict[str, List[float]] = defaultdict(list)
        
        # Suspicious activity detection
        self.suspicious_patterns: Dict[str, int] = defaultdict(int)
        self.pattern_window: deque = deque(maxlen=1000)
        
        # Blacklist
        self.blacklisted_ips: Dict[str, float] = {}
        self.failed_auth_attempts: Dict[str, int] = defaultdict(int)
        
        # Statistics
        self.total_requests = 0
        self.blocked_requests = 0
        self.suspicious_ips = set()
        
        ozon_logger.logger.info(f"DDoS защита инициализирована с конфигурацией: {config}")
    
    def is_whitelisted(self, client_ip: str) -> bool:
        """Проверяет, находится ли IP в белом списке"""
        return client_ip in self.config.whitelisted_ips
    
    def is_blacklisted(self, client_ip: str) -> bool:
        """Проверяет, заблокирован ли IP"""
        if client_ip in self.blacklisted_ips:
            # Проверяем, не истек ли срок блокировки
            if time.time() - self.blacklisted_ips[client_ip] > self.config.blacklist_duration_hours * 3600:
                del self.blacklisted_ips[client_ip]
                return False
            return True
        return False
    
    def add_to_blacklist(self, client_ip: str, reason: str) -> None:
        """Добавляет IP в черный список"""
        self.blacklisted_ips[client_ip] = time.time()
        ozon_logger.logger.warning(f"IP {client_ip} добавлен в черный список: {reason}")
    
    def check_rate_limits(self, client_ip: str) -> Tuple[bool, str]:
        """Проверяет все rate limits"""
        now = time.time()
        
        # Проверяем минутный лимит
        self.minute_requests[client_ip] = deque(
            [t for t in self.minute_requests[client_ip] if now - t < 60],
            maxlen=self.config.max_requests_per_minute
        )
        if len(self.minute_requests[client_ip]) >= self.config.max_requests_per_minute:
            return False, "Minute rate limit exceeded"
        
        # Проверяем часовой лимит
        self.hour_requests[client_ip] = deque(
            [t for t in self.hour_requests[client_ip] if now - t < 3600],
            maxlen=self.config.max_requests_per_hour
        )
        if len(self.hour_requests[client_ip]) >= self.config.max_requests_per_hour:
            return False, "Hour rate limit exceeded"
        
        # Проверяем дневной лимит
        self.day_requests[client_ip] = deque(
            [t for t in self.day_requests[client_ip] if now - t < 86400],
            maxlen=self.config.max_requests_per_day
        )
        if len(self.day_requests[client_ip]) >= self.config.max_requests_per_day:
            return False, "Day rate limit exceeded"
        
        return True, "OK"
    
    def check_burst_protection(self, client_ip: str) -> Tuple[bool, str]:
        """Проверяет защиту от burst атак"""
        now = time.time()
        
        # Очищаем старые запросы
        self.burst_requests[client_ip] = deque(
            [t for t in self.burst_requests[client_ip] if now - t < self.config.burst_window_seconds],
            maxlen=self.config.max_burst_requests
        )
        
        if len(self.burst_requests[client_ip]) >= self.config.max_burst_requests:
            return False, "Burst protection triggered"
        
        return True, "OK"
    
    def check_suspicious_patterns(self, client_ip: str, request_data: dict) -> Tuple[bool, str]:
        """Проверяет подозрительные паттерны"""
        now = time.time()
        
        # Добавляем паттерн в окно
        pattern = f"{client_ip}:{request_data.get('query', '')[:10]}"
        self.pattern_window.append((pattern, now))
        
        # Подсчитываем повторяющиеся паттерны
        recent_patterns = [p for p, t in self.pattern_window if now - t < 300]  # 5 минут
        pattern_count = recent_patterns.count(pattern)
        
        if pattern_count > self.config.suspicious_pattern_threshold:
            self.suspicious_ips.add(client_ip)
            return False, f"Suspicious pattern detected: {pattern_count} similar requests"
        
        return True, "OK"
    
    def check_connection_limits(self, client_ip: str) -> Tuple[bool, str]:
        """Проверяет лимиты соединений"""
        now = time.time()
        
        # Очищаем старые соединения
        self.connection_timestamps[client_ip] = [
            t for t in self.connection_timestamps[client_ip] 
            if now - t < 60  # 1 минута
        ]
        
        if len(self.connection_timestamps[client_ip]) >= self.config.max_concurrent_connections:
            return False, "Too many concurrent connections"
        
        return True, "OK"
    
    def record_request(self, client_ip: str, request_data: dict) -> None:
        """Записывает информацию о запросе"""
        now = time.time()
        
        # Записываем в rate limiting
        self.minute_requests[client_ip].append(now)
        self.hour_requests[client_ip].append(now)
        self.day_requests[client_ip].append(now)
        
        # Записываем в burst protection
        self.burst_requests[client_ip].append(now)
        
        # Записываем соединение
        self.connection_timestamps[client_ip].append(now)
        
        # Обновляем статистику
        self.total_requests += 1
    
    def record_failed_auth(self, client_ip: str) -> None:
        """Записывает неуспешную попытку аутентификации"""
        self.failed_auth_attempts[client_ip] += 1
        
        if self.failed_auth_attempts[client_ip] >= self.config.max_failed_auth_attempts:
            self.add_to_blacklist(client_ip, "Too many failed auth attempts")
    
    def is_request_allowed(self, client_ip: str, request_data: dict) -> Tuple[bool, str, dict]:
        """Основная функция проверки разрешения запроса"""
        # Проверяем белый список
        if self.is_whitelisted(client_ip):
            return True, "Whitelisted", {}
        
        # Проверяем черный список
        if self.is_blacklisted(client_ip):
            return False, "Blacklisted", {}
        
        # Проверяем все лимиты
        checks = [
            ("rate_limits", self.check_rate_limits(client_ip)),
            ("burst_protection", self.check_burst_protection(client_ip)),
            ("suspicious_patterns", self.check_suspicious_patterns(client_ip, request_data)),
            ("connection_limits", self.check_connection_limits(client_ip))
        ]
        
        for check_name, (allowed, reason) in checks:
            if not allowed:
                self.blocked_requests += 1
                ozon_logger.logger.warning(f"Запрос заблокирован: {client_ip} - {check_name}: {reason}")
                return False, reason, {"check": check_name}
        
        # Записываем успешный запрос
        self.record_request(client_ip, request_data)
        
        return True, "OK", {}
    
    def get_statistics(self) -> dict:
        """Возвращает статистику защиты"""
        return {
            "total_requests": self.total_requests,
            "blocked_requests": self.blocked_requests,
            "blacklisted_ips": len(self.blacklisted_ips),
            "suspicious_ips": len(self.suspicious_ips),
            "active_connections": len(self.active_connections),
            "block_rate": self.blocked_requests / max(self.total_requests, 1) * 100
        }
    
    def cleanup_expired_data(self) -> None:
        """Очищает устаревшие данные"""
        now = time.time()
        
        # Очищаем старые записи из черного списка
        expired_blacklist = [
            ip for ip, timestamp in self.blacklisted_ips.items()
            if now - timestamp > self.config.blacklist_duration_hours * 3600
        ]
        for ip in expired_blacklist:
            del self.blacklisted_ips[ip]
        
        # Очищаем старые паттерны
        self.pattern_window = deque(
            [item for item in self.pattern_window if now - item[1] < 3600],  # 1 час
            maxlen=1000
        )
        
        if expired_blacklist:
            ozon_logger.logger.info(f"Очищено {len(expired_blacklist)} устаревших записей из черного списка")


# Глобальный экземпляр защиты
ddos_protection = AdvancedDDoSProtection(DDoSConfig()) 