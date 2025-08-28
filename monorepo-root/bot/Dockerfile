# Dev Dockerfile for Telegram bot
FROM node:18-alpine AS base

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm ci

COPY . .

# Development target: run with nodemon + ts-node
FROM base AS development
ENV NODE_ENV=development
RUN npm i -g nodemon ts-node
EXPOSE 9229
CMD ["npm", "run", "dev:debug"]

# Production target (optional)
FROM base AS production
RUN npm run build && npm prune --production
CMD ["npm", "run", "start:prod"]


