# 🔗 Внутренняя передача данных в MarketVision

## 📋 Обзор архитектуры

### Текущая конфигурация
```
🌐 Внешние запросы (с SSL):
├── HTTPS (443) → nginx → product-filter-service
├── HTTPS (443) → nginx → db-api (REST)
└── HTTPS (443) → nginx → frontend (Next.js)

🔗 Внутренние gRPC подключения (без SSL):
├── product-filter-service → marketvision-wb-parser:3000
├── product-filter-service → marketvision-ozon-parser:3002
└── product-filter-service → marketvision-database-api:50051
```

## 🛡️ Безопасность

### Внешние подключения (через nginx)
- **SSL/TLS**: Обязательно для всех внешних запросов
- **Сертификаты**: Самоподписанные сертификаты в `/etc/nginx/certs/`
- **Заголовки безопасности**: HSTS, X-Frame-Options, X-Content-Type-Options
- **Таймауты**: Настроены для предотвращения DDoS

### Внутренние подключения (Docker network)
- **SSL**: Отключен для производительности
- **Сеть**: Изолированная Docker network `marketvision-net`
- **IP-фильтрация**: Только внутренние IP-адреса Docker
- **Keepalive**: Настроен для оптимизации соединений

## 🔧 Конфигурация Nginx

### Основные принципы
```nginx
# Внешние upstreams с keepalive
upstream product_filter_service {
    server marketvision-product-aggregator:3001;
    keepalive 32;  # Оптимизация соединений
}

# Внутренние gRPC upstreams (для будущего использования)
upstream grpc_wb {
    server marketvision-wb-parser:3000;
    keepalive 32;
}
```

### SSL настройки
```nginx
# Современные SSL протоколы
ssl_protocols TLSv1.2 TLSv1.3;

# Безопасные шифры
ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;

# Кэширование SSL сессий
ssl_session_cache shared:SSL:10m;
ssl_session_timeout 10m;
```

### Заголовки безопасности
```nginx
# Защита от XSS
add_header X-XSS-Protection "1; mode=block" always;

# Защита от clickjacking
add_header X-Frame-Options "SAMEORIGIN" always;

# Защита от MIME sniffing
add_header X-Content-Type-Options "nosniff" always;

# HSTS
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
```

## 🚀 Производительность

### Keepalive соединения
- **Внешние**: 32 соединения на upstream
- **Внутренние**: 32 соединения на upstream
- **Таймаут**: 60 секунд

### Буферизация
```nginx
proxy_buffering on;
proxy_buffer_size 4k;
proxy_buffers 8 4k;
proxy_busy_buffers_size 8k;
```

### Кэширование
```nginx
# Статические данные
proxy_cache_valid 200 1h;
proxy_cache_valid 404 1m;

# Статические файлы
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

## 🔍 Мониторинг

### Health checks
```yaml
# Docker health check для nginx
healthcheck:
  test: ["CMD", "curl", "-f", "http://localhost:8080/nginx-health"]
  interval: 30s
  timeout: 10s
  retries: 3
  start_period: 40s
```

### Логирование
```yaml
# Ротация логов
logging:
  driver: "json-file"
  options:
    max-size: "10m"
    max-file: "3"
```

## 📊 Таймауты

### Внешние запросы
- **Connect**: 60s
- **Send**: 60s
- **Read**: 60s

### Парсинг (специальные таймауты)
- **Read**: 300s (5 минут)
- **Send**: 300s (5 минут)

## 🔒 IP-фильтрация

### Внутренний сервер (порт 8080)
```nginx
# Разрешаем только Docker networks
allow 172.16.0.0/12;  # Docker network
allow 192.168.0.0/16; # Docker network
deny all;
```

## 🚨 Лучшие практики

### Безопасность
1. ✅ Используй SSL для всех внешних подключений
2. ✅ Настрой правильные заголовки безопасности
3. ✅ Ограничивай доступ к внутренним портам
4. ✅ Используй современные SSL протоколы
5. ✅ Настрой HSTS для принудительного HTTPS

### Производительность
1. ✅ Используй keepalive соединения
2. ✅ Настрой буферизацию
3. ✅ Кэшируй статические файлы
4. ✅ Оптимизируй таймауты
5. ✅ Мониторь логи и метрики

### Надежность
1. ✅ Настрой health checks
2. ✅ Ротация логов
3. ✅ Graceful shutdown
4. ✅ Мониторинг ресурсов
5. ✅ Backup конфигураций

## 🔧 Команды для управления

### Перезапуск nginx
```bash
cd nginx
docker-compose restart nginx
```

### Проверка конфигурации
```bash
# Проверка health check
curl http://localhost:8080/nginx-health

# Проверка SSL
curl -k https://localhost/products/search

# Проверка редиректа
curl -I http://localhost/api/products
```

### Просмотр логов
```bash
# Логи nginx
docker logs marketvision-nginx-proxy

# Логи с follow
docker logs -f marketvision-nginx-proxy
```

## 📝 Примечания

- **Внутренние gRPC подключения**: Настроены без SSL для производительности
- **Внешние REST API**: Всегда через HTTPS с SSL
- **Docker network**: Изолированная сеть для безопасности
- **Keepalive**: Оптимизирует повторное использование соединений
- **Health checks**: Только для nginx, остальные сервисы мониторятся через Docker 