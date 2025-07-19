# MarketVision - Система анализа товаров

Монорепозиторий для анализа и классификации товаров с различных маркетплейсов.

## 🏗️ Архитектура

### Основные сервисы:
- **bot/** - Telegram бот для взаимодействия с пользователями
- **db-api/** - API для работы с базой данных (NestJS)
- **marketvision-api/** - Веб-интерфейс для визуализации данных (Next.js)
- **product-filter-service/** - Сервис фильтрации и валидации товаров
- **wb-api/** - API для работы с Wildberries
- **ozon-api/** - API для работы с Ozon

## 🚀 Быстрый старт

1. **Установка зависимостей:**
```bash
npm install
```

2. **Запуск через Docker:**
```bash
docker-compose up -d
```

3. **Запуск API:**
```bash
node run-api.js
```

## 📚 Документация

- [Руководство разработчика](DEVELOPER_GUIDE.md)
- [Руководство по установке](INSTALLATION_GUIDE.md)
- [Стандарт API и данных](API-DATA-STANDARD.md)

## 🛠️ Технологии

- **Backend:** Node.js, NestJS, Prisma
- **Frontend:** Next.js, React
- **Database:** PostgreSQL

- **Infrastructure:** Docker, Docker Compose

## 📊 Статус проекта

- ✅ Основные API работают
- ✅ База данных настроена
- ✅ Docker конфигурация готова


## 👨‍💻 Автор

**by Morzh** - Проект создан для развития валидатора товаров электроники

---

*Версия: $(cat version.txt)* 