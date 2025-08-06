# Этап сборки (builder)
FROM node:18-alpine AS builder

WORKDIR /usr/src/app

# Копируем package.json и package-lock.json
COPY package*.json ./

# Устанавливаем зависимости
RUN npm install

# Копируем исходный код
COPY . .

# Собираем TypeScript проект
RUN npm run build

# ---

# Финальный этап (production)
FROM node:18-alpine

WORKDIR /usr/src/app

# Создаем непривилегированного пользователя
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Копируем скомпилированный код из этапа сборки
COPY --from=builder /usr/src/app/dist ./dist

# Копируем node_modules
COPY --from=builder /usr/src/app/node_modules ./node_modules

# Копируем package.json и package-lock.json
COPY --from=builder /usr/src/app/package*.json ./

# Копируем proto-файлы
COPY --from=builder /usr/src/app/proto ./proto

# Устанавливаем владельца файлов
RUN chown -R appuser:appgroup /usr/src/app

# Используем непривилегированного пользователя
USER appuser

# Открываем порт gRPC
EXPOSE 3000

# Команда для запуска приложения
CMD ["node", "dist/main"]
