FROM node:20-alpine

WORKDIR /app

# Копируем файлы зависимостей (для лучшего кэширования)
COPY package*.json ./

# Устанавливаем зависимости (кэшируется отдельно)
RUN npm ci --only=production
RUN apk add --no-cache curl

# Копируем все файлы
COPY . .

# Генерируем Prisma клиент (после копирования схемы)
RUN npx prisma generate

# Собираем приложение (кэшируется отдельно)
RUN npm run build

# Создаем скрипт инициализации базы данных
RUN echo '#!/bin/sh' > /usr/local/bin/init-db.sh && \
    echo 'echo "🗄️ Инициализация базы данных..."' >> /usr/local/bin/init-db.sh && \
    echo 'until npx prisma db push --accept-data-loss; do' >> /usr/local/bin/init-db.sh && \
    echo '  echo "⏳ База данных недоступна, повторная попытка через 5 секунд..."' >> /usr/local/bin/init-db.sh && \
    echo '  sleep 5' >> /usr/local/bin/init-db.sh && \
    echo 'done' >> /usr/local/bin/init-db.sh && \
    echo 'echo "✅ База данных инициализирована успешно!"' >> /usr/local/bin/init-db.sh && \
    echo 'echo "👤 Создание администратора..."' >> /usr/local/bin/init-db.sh && \
    echo 'node -e "const { PrismaClient } = require(\"@prisma/client\"); const bcrypt = require(\"bcryptjs\"); (async () => { const prisma = new PrismaClient(); try { const existing = await prisma.user.findUnique({ where: { username: \"pavlishev\" } }); if (!existing) { const hash = bcrypt.hashSync(\"171989Bkmz\", 10); await prisma.user.create({ data: { username: \"pavlishev\", password: hash, role: \"admin\" } }); console.log(\"✅ Администратор создан\"); } else { console.log(\"✅ Администратор уже существует\"); } } catch (e) { console.error(\"❌ Ошибка:\", e.message); } finally { await prisma.\$disconnect(); } })()"' >> /usr/local/bin/init-db.sh && \
    echo 'echo "🚀 Запуск приложения..."' >> /usr/local/bin/init-db.sh && \
    echo 'exec "$@"' >> /usr/local/bin/init-db.sh && \
    chmod +x /usr/local/bin/init-db.sh

# Открываем порты
EXPOSE 3003 50051

# Запускаем инициализацию базы данных и приложение
CMD ["/usr/local/bin/init-db.sh", "npm", "run", "start:prod"] 