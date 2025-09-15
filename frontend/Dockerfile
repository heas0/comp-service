# Dockerfile фронтенда: сборка Vite + отдача через Nginx

# 1) Стадия сборки
FROM node:20-alpine AS build
WORKDIR /app
COPY package.json package-lock.json* ./
RUN if [ -f package-lock.json ]; then \
			npm ci; \
		else \
			npm install; \
		fi
COPY . .
# По умолчанию базовый URL API — /api; можно переопределить через build-arg
ARG VITE_API_URL=/api
ENV VITE_API_URL=${VITE_API_URL}
RUN npm run build

# 2) Стадия рантайма
FROM nginx:1.27-alpine AS runtime
COPY --from=build /app/dist /usr/share/nginx/html
# Кастомный конфиг Nginx с SPA-фоллбеком и прокси API
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
