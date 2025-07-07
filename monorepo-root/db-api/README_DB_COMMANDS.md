# Команды для работы с базой данных (Postgres, Docker)

## Вход в контейнер с Postgres
```bash
docker exec -it db-api-postgres-1 psql -U postgres
```

## Основные команды psql

### Список баз данных
```sql
\l
```

### Подключиться к базе (если нужно)
```sql
\c postgres
```

### Список таблиц
```sql
\dt
```

### Посмотреть содержимое таблицы
```sql
SELECT * FROM "Product";
SELECT * FROM "PriceHistory";
```

### Удалить все данные из таблицы
```sql
DELETE FROM "Product";
DELETE FROM "PriceHistory";
```

### Выйти из psql
```sql
\q
```

---

## Применение миграций Prisma (если структура изменилась)

В папке `monorepo-root/db-api`:
```bash
npx prisma migrate deploy
# или для разработки
npx prisma migrate dev
```

---

## Проверка подключения к базе из консоли
```bash
psql -h localhost -U postgres -d postgres
```

---

**Если будут ошибки или вопросы — смотри этот файл или обратись к AI!** 