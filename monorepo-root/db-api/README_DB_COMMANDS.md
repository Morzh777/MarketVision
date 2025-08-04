# Команды для работы с базой данных (Postgres, Docker)

## Вход в контейнер с Postgres
```bash
docker exec -it marketvision-postgres psql -U marketvision
```

Или можно подключиться к базе данных `marketvision`:

```bash
docker exec -it marketvision-postgres psql -U marketvision -d marketvision
```

## Основные команды psql

### Список баз данных
```sql
\l
```

### Подключиться к базе (если нужно)
```sql
\c marketvision
```

### Список таблиц
```sql
\dt
```

### Посмотреть содержимое таблицы
```sql
SELECT * FROM "Product";
SELECT * FROM "PriceHistory";
SELECT * FROM "MarketStats";
```

### Удалить все данные из таблицы
```sql
DELETE FROM "Product";
DELETE FROM "PriceHistory";
DELETE FROM "MarketStats";
```

### Выйти из psql
```sql
\q
```

---

## Создание таблиц в базе данных

### Первоначальная настройка (если таблиц нет)

В папке `monorepo-root/db-api`:
```bash
# Генерировать Prisma Client
npx prisma generate

# Создать и применить миграции (создает таблицы)
npx prisma migrate dev
```

### Применение миграций Prisma (если структура изменилась)

В папке `monorepo-root/db-api`:
```bash
npx prisma migrate deploy
# или для разработки
npx prisma migrate dev
```

### Проверка что таблицы созданы

После миграций проверьте:
```bash
docker exec -it marketvision-postgres psql -U postgres -d marketvision
```

В psql выполните:
```sql
\dt
```

Должны появиться таблицы: `Product`, `PriceHistory`, `MarketStats`

---

## Проверка подключения к базе из консоли
```bash
psql -h localhost -U postgres -d postgres
```

---

**Если будут ошибки или вопросы — смотри этот файл или обратись к AI!** 

### Посмотреть структуру всех таблиц
```sql
\dt+ 
```

### Посмотреть структуру конкретной таблицы (описание колонок)
```sql
\d+ "Product"
\d+ "PriceHistory"
\d+ "MarketStats"
```

### Посмотреть индексы таблицы
```sql
\di
```

### Посмотреть связи (foreign keys)
```sql
SELECT
  tc.table_schema, 
  tc.constraint_name, 
  tc.table_name, 
  kcu.column_name, 
  ccu.table_schema AS foreign_table_schema,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name 
FROM 
  information_schema.table_constraints AS tc 
  JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
  JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = ccu.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY';
``` 

### Глобальная очистка всех таблиц
```sql
DELETE FROM "Product";
DELETE FROM "PriceHistory";
DELETE FROM "MarketStats";
```

## Основные команды psql

### Список баз данных
```sql
\l
```