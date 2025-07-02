# WB-API Microservice

Микросервис на базе [NestJS](https://nestjs.com/) для парсинга и агрегации данных о компьютерных комплектующих (видеокарты, процессоры и др.) с Wildberries. Используется как часть монорепозитория, поддерживает кеширование фото через Redis, легко расширяется под новые категории.

## Описание

Сервис реализует микросервисную архитектуру для парсинга компьютерных комплектующих с Wildberries. Для каждой категории (например, видеокарты, процессоры) реализован отдельный модуль.

### Ключевые особенности:
- **Поиск самой дешёвой видеокарты и процессора** по каждому запросу из предустановленного списка.
- **Фильтрация нерелевантных товаров** по ключевым словам и шаблонам.
- **Кеширование фотографий**: найденные фото товаров сохраняются в Redis для ускорения последующих запросов.
- **Удаление дублей**: в итоговом списке только уникальные товары по id (даже если один и тот же товар попал по разным запросам).
- **Гибкая архитектура**: легко добавить новые категории или изменить логику поиска.

#### Как работает кеш фотографий
- Кеш фотографий хранится в Redis с уникальным префиксом для каждой категории.
- При каждом запуске сервис использует этот кеш для ускорения поиска фото.
- Если фото для товара найдено впервые, оно добавляется в кеш. Если фото устарело или недоступно — сервис ищет новое и обновляет кеш.

#### Логика поиска и фильтрации
- Для каждого поискового запроса сервис делает запрос к Wildberries API.
- Из полученного списка товаров выбирается **самый дешёвый** товар, который проходит фильтр по названию.
- Если подходящих товаров нет — результат по этому запросу пропускается.
- После сбора всех результатов сервис оставляет только уникальные товары по `product.id`.

## Основные возможности

- **Поиск по списку запросов**: Сервис ищет самые дешёвые предложения по предустановленному списку моделей.
- **Фильтрация**: Встроенная логика помогает отсеивать нерелевантные товары (например, аксессуары, кабели, ноутбуки).
- **Поиск и кеширование фотографий**: Реализован механизм поиска реальных фотографий товаров, включая их кеширование для ускорения повторных запросов. Кеш хранится в Redis.
- **Удаление дублей**: В итоговом списке только уникальные товары по id.
- **Модульная структура**: Легко добавлять парсеры для новых категорий товаров, не затрагивая существующую логику.

## Требования

- Node.js >= 18
- npm
- Redis (локально или в Docker/WSL)

## Технологический стек

-   [NestJS](https://nestjs.com/) - прогрессивный Node.js фреймворк для создания эффективных и масштабируемых серверных приложений.
-   [TypeScript](https://www.typescriptlang.org/) - для строгой типизации и улучшения качества кода.
-   [Axios](https://axios-http.com/) - для выполнения HTTP-запросов к API Wildberries.

---

## ⚙️ Технические параметры WB API

### WB xsubject значения (категории товаров)

**Актуальные значения xsubject для запросов к Wildberries API:**

| Категория | xsubject | Описание |
|-----------|----------|----------|
| **Видеокарты** | `3274` | Видеокарты и GPU для компьютеров |
| **Процессоры** | `3698` | CPU и процессоры для ПК |
| **Материнские платы** | `3690` | Материнские платы и системные платы |

### Использование в коде

```typescript
// Видеокарты
protected readonly xsubject = 3274;

// Процессоры
protected readonly xsubject = 3698;

// Материнские платы
protected readonly xsubject = 3690;
```

### Примеры API запросов к WB

```
https://search.wb.ru/exactmatch/ru/common/v4/search?appType=1&couponsGeo=12,3,18,15,21&curr=rub&dest=-1257786&query=rtx4070&resultset=catalog&sort=priceup&spp=30&suppressSpellcheck=false&xsubject=3274

https://search.wb.ru/exactmatch/ru/common/v4/search?appType=1&couponsGeo=12,3,18,15,21&curr=rub&dest=-1257786&query=ryzen7&resultset=catalog&sort=priceup&spp=30&suppressSpellcheck=false&xsubject=3698
```

**⚠️ Важно:** Эти значения специфичны для Wildberries API и могут изменяться. При изменении категорий на WB необходимо обновить значения в сервисах.

---

## Установка и запуск

1. **Установите и запустите Redis**

   - **Через Docker** (рекомендуется):
     ```sh
     docker run --name redis -p 6379:6379 redis
     ```
   - **Через WSL**:
     ```sh
     sudo apt update
     sudo apt install redis-server
     redis-server
     ```
   - **Портированная версия для Windows**:  
     [Инструкция](https://github.com/tporadowski/redis/releases)

2. **Перейдите в директорию сервиса:**
   ```sh
   cd monorepo-root/wb-api
   ```

3. **Установите зависимости:**
   ```sh
   npm install
   ```

4. **Запустите приложение в режиме разработки:**
   ```sh
   npm run start:dev
   ```
   Сервер будет доступен по адресу [http://localhost:3000](http://localhost:3000).

5. **Запуск в продакшен-режиме:**
   ```sh
   npm run build
   npm run start:prod
   ```

---

## API Endpoints

### Видеокарты

- `GET /parser/videocards`  
  Получить список самых дешёвых видеокарт по предустановленным запросам.

### Процессоры

- `GET /parser/cpus`  
  Получить список самых дешёвых процессоров по предустановленным запросам.

### Материнские платы

- `GET /parser/motherboards`  
  Получить список самых дешёвых материнских плат по предустановленным запросам.

---

## 🚀 Быстрый доступ к парсингу

Для удобного тестирования и использования API:

### 📱 Прямые ссылки (откроются в браузере):
- **Видеокарты**: [http://localhost:3000/parser/videocards](http://localhost:3000/parser/videocards)
- **Процессоры**: [http://localhost:3000/parser/cpus](http://localhost:3000/parser/cpus)
- **Материнские платы**: [http://localhost:3000/parser/motherboards](http://localhost:3000/parser/motherboards)

### 💻 Через curl:
```bash
# Парсинг видеокарт
curl http://localhost:3000/parser/videocards

# Парсинг процессоров  
curl http://localhost:3000/parser/cpus

# Парсинг материнских плат
curl http://localhost:3000/parser/motherboards
```

### 🔧 Для разработки:
```bash
# С красивым форматированием JSON
curl -s http://localhost:3000/parser/cpus | jq '.'

# Только статистика
curl -s http://localhost:3000/parser/cpus | jq '.stats'

# Только результаты
curl -s http://localhost:3000/parser/cpus | jq '.results[]'
```

---

## Структура ответа API

API возвращает объект с двумя ключами: `results` (массив найденных товаров) и `stats` (статистика выполнения запроса).

### Основная структура

```json
{
  "results": [
    // ... массив объектов SearchResult
  ],
  "stats": {
    // ... объект Stats
  }
}
```

---

### Объект `SearchResult` (Элемент массива `results`)

Каждый объект в массиве `results` представляет собой один уникальный товар, найденный по одному из поисковых запросов.

```json
{
  "query": "rtx 4070 super",
  "product": {
    "id": 218737525,
    "name": "Видеокарта игровая NVIDIA GeForce RTX 4070 SUPER",
    "brand": "KFA2",
    "price": 67924,
    "sizes": [
        // ... служебная информация WB
    ]
  },
  "stableId": "kfa2rtx4070supergaming",
  "photoFound": true,
  "photoUrl": "https://basket-21.wbbasket.ru/vol2187/part218737/218737525/images/big/1.webp",
  "previousPrice": 71000,
  "discount": 4
}
```

| Поле | Тип | Описание |
| :--- | :--- | :--- |
| `query` | `string` | Поисковый запрос, по которому был найден товар (например, "rtx 4070 super"). |
| `product` | `object` | Объект с основной информацией о товаре от Wildberries. |
| `product.id` | `number` | Уникальный числовой ID товара на Wildberries. **Может меняться.** |
| `product.name` | `string` | Полное название товара. |
| `product.brand`| `string` | Бренд товара. |
| `stableId` | `string` | **Стабильный идентификатор**, сгенерированный на основе названия товара. Используется для надежного отслеживания цены и истории постов, не зависит от `product.id`. |
| `photoFound` | `boolean` | `true`, если удалось найти и проверить рабочую ссылку на фото товара. |
| `photoUrl` | `string` | Прямая ссылка на изображение товара в формате `.webp`. |
| `previousPrice`| `number` | Предыдущая "лучшая" цена на этот товар, зафиксированная в Redis. |
| `discount` | `number` | Рассчитанная скидка в процентах, если текущая цена ниже предыдущей. |

---

### Объект `Stats`

Объект `stats` содержит сводную информацию о процессе парсинга.

```json
{
  "executionTime": 25.4,
  "totalProducts": 21,
  "foundPhotos": 21,
  "errorCount": 2,
  "photoSuccessRate": 1,
  "avgSpeed": 0.85
}
```

| Поле | Тип | Описание |
| :--- | :--- | :--- |
| `executionTime` | `number` | Общее время выполнения запроса в секундах. |
| `totalProducts` | `number` | Количество **уникальных** товаров, найденных по всем запросам. |
| `foundPhotos` | `number` | Количество товаров, для которых удалось найти фото. |
| `errorCount` | `number` | Количество запросов, которые завершились с ошибкой (например, из-за таймаута). |
| `photoSuccessRate`|`number`| Процент успешно найденных фотографий (от 0 до 1). |
| `avgSpeed` | `number` | Среднее время на обработку одного товара в секундах. |


---

## Архитектура и расширяемость

- Вся общая логика вынесена в абстрактный класс `BaseParserService` (очереди, кеш, поиск, фильтрация, работа с фото, логирование).
- Сервисы видеокарт и процессоров наследуют этот базовый класс и реализуют только уникальные параметры (список запросов, subjectId, фильтр).
- Кеш фото реализован через Redis с уникальным префиксом для каждой категории.
- Легко добавить новые категории: создайте сервис, укажите параметры и реализуйте фильтр.

---

## Управление Redis

### Проверка подключения к Redis

Создайте файл `test-redis.js` в корне проекта:

```javascript
import { createClient } from 'redis';

const client = createClient({ 
  url: process.env.REDIS_URL || 'redis://localhost:6379' 
});

async function testRedis() {
  try {
    await client.connect();
    console.log('✅ Redis подключение успешно!');
    
    // Тест записи и чтения
    await client.set('test', 'hello');
    const value = await client.get('test');
    console.log(`📝 Тест записи/чтения: ${value}`);
    
    // Очищаем тестовый ключ
    await client.del('test');
    console.log('🧹 Тестовый ключ удален');
    
  } catch (error) {
    console.error('❌ Ошибка подключения к Redis:', error.message);
  } finally {
    await client.disconnect();
  }
}

testRedis();
```

Запуск:
```bash
node test-redis.js
```

### Очистка всех кэшей Redis

Создайте файл `clear-redis.js` в корне проекта:

```javascript
import { createClient } from 'redis';

const client = createClient({ 
  url: process.env.REDIS_URL || 'redis://localhost:6379' 
});

async function clearRedis() {
  try {
    await client.connect();
    console.log('🔗 Подключился к Redis');

    // Получаем все ключи
    const allKeys = await client.keys('*');
    console.log(`📊 Найдено ключей: ${allKeys.length}`);

    if (allKeys.length === 0) {
      console.log('✅ Redis уже пуст');
      return;
    }

    // Группируем ключи по типам
    const photoKeys = allKeys.filter(key => key.includes(':'));
    const priceKeys = allKeys.filter(key => key.startsWith('last_posted_price:'));
    const historyKeys = allKeys.filter(key => key.startsWith('price_history:'));
    const postedKeys = allKeys.filter(key => key.startsWith('posted:'));

    console.log(`📸 Фото-кэш: ${photoKeys.length} ключей`);
    console.log(`💰 Кэш цен: ${priceKeys.length} ключей`);
    console.log(`📈 История цен: ${historyKeys.length} ключей`);
    console.log(`📝 История постов: ${postedKeys.length} ключей`);

    // Удаляем все ключи
    if (allKeys.length > 0) {
      await client.del(allKeys);
      console.log('🗑️ Все ключи удалены');
    }

    // Проверяем, что всё удалено
    const remainingKeys = await client.keys('*');
    console.log(`✅ Осталось ключей: ${remainingKeys.length}`);

  } catch (error) {
    console.error('❌ Ошибка при очистке Redis:', error);
  } finally {
    await client.disconnect();
    console.log('🔌 Отключился от Redis');
  }
}

clearRedis();
```

Запуск:
```bash
node clear-redis.js
```

### Когда нужно очищать кэш

- **После изменения логики фильтрации** (чтобы старые данные не влияли на результат)
- **При изменении структуры данных** в кэше
- **При тестировании новых функций**
- **При проблемах с некорректными данными** в кэше

### Типы кэшей в Redis

1. **Фото-кэш** (`prefix:product_id`) - URL фотографий товаров
2. **Кэш цен** (`last_posted_price:category:stable_id`) - последние опубликованные цены
3. **История цен** (`price_history:category:stable_id`) - история изменения цен
4. **История постов** (`posted:category:stable_id`) - отметки об опубликованных товарах

---

## Частые ошибки

- **ECONNREFUSED при запуске** — Redis не запущен или недоступен. Проверьте, что Redis работает на `localhost:6379`.
- **Проблемы с зависимостями** — убедитесь, что выполнили `npm install` в папке сервиса.

---

## Тесты

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

---

## License

Nest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).

## Быстрый запуск парсинга из браузера

- [Парсинг видеокарт](http://localhost:3000/parser/videocards)
- [Парсинг процессоров](http://localhost:3000/parser/cpus)
- [Парсинг материнских плат](http://localhost:3000/parser/motherboards)
