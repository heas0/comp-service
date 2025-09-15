# Backend Dockerfile (Node 20 LTS)
FROM node:20-alpine AS base

WORKDIR /app

# Нативные зависимости для модулей вроде bcrypt
RUN apk add --no-cache python3 make g++

# Установка только прод-зависимостей (поддержка с lockfile и без него)
COPY package.json package-lock.json* ./
RUN if [ -f package-lock.json ]; then \
			npm ci --omit=dev; \
		else \
			npm install --omit=dev; \
		fi

# Copy source
COPY . .

# Открываем порт backend
EXPOSE 5000

# Команда по умолчанию запускает сервер (применение схемы можно выполнять отдельно через compose)
CMD ["node", "server.js"]
