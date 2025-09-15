# Деплой (Beget VPS) — comp-service

В этом руководстве показано, как развернуть приложение на VPS (Ubuntu 24.04 LTS) под поддоменом `comp-service.amerom6a.beget.tech` с использованием Docker и docker compose. SPA (React) отдаётся через Nginx, а запросы к `/api` проксируются на Node backend; Postgres запускается в отдельном контейнере.

## 1) Предварительные требования

-   Пропишите DNS A‑запись для `comp-service.amerom6a.beget.tech` на IP вашего VPS
-   Доступ по SSH с правами sudo
-   Установленные Docker Engine и docker compose plugin

Быстрая установка Docker на Ubuntu:

```bash
sudo apt update -y
sudo apt install -y ca-certificates curl gnupg lsb-release
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo $VERSION_CODENAME) stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt update -y
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
sudo usermod -aG docker $USER
# выйдите и зайдите в сессию заново, чтобы группа docker применилась
```

## 2) Получение кода и настройка переменных окружения

```bash
cd ~
# Клонируем репозиторий
git clone https://github.com/heas0/comp-service.git
cd comp-service

# Подготовка переменных окружения
cp .env.example .env
# Отредактируйте .env — задайте надёжные значения:
# POSTGRES_PASSWORD=...
# JWT_SECRET=...
```

## 3) Первый запуск (сборка + старт)

```bash
# Сборка образов и старт контейнеров
docker compose up -d --build

# Проверка статуса контейнеров
docker compose ps
```

После запуска стек слушает:

-   http://SERVER_IP — SPA через Nginx (с проксированием /api)
-   http://SERVER_IP:5000 — Backend (проброшен для отладки; можно убрать маппинг порта)

## 4) Инициализация базы данных (схема + сиды)

Запустите однократные задания внутри контейнера backend:

```bash
# Применить схему (если не применена автоматически) и заполнить тестовыми данными
docker compose exec backend node scripts/apply-schema.js
docker compose exec backend node scripts/seed-data.js

# (Опционально) Автоматическое создание пользователя
# Если в .env задать ADMIN_USERNAME и ADMIN_PASSWORD,
# при старте backend пользователь будет создан автоматически (если его ещё нет).
# Для ручного запуска:
docker compose exec backend node scripts/seed-user.js
```

## 5) Подключение домена

-   Убедитесь, что порт 80 открыт во внешнем фаерволе (если есть)
-   Мы уже мапим фронтовый контейнер на порт 80 хоста (см. docker-compose.yml)
-   В DNS укажите A‑запись `comp-service.amerom6a.beget.tech` → ваш IP

### HTTPS (рекомендуется)

Вариант A: внешний reverse‑proxy на хосте (Caddy или Nginx + certbot), проксирующий к `127.0.0.1:80`. Ниже простой пример конфигурации Nginx на хосте (сертификат получите certbot‑ом или у провайдера):

```nginx
server {
    server_name comp-service.amerom6a.beget.tech;
    listen 80;

    location / {
        proxy_pass http://127.0.0.1:80;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Для автоматического HTTPS проще всего использовать Caddy либо Traefik (могу добавить конфигурацию в compose по запросу).

## 6) Обновления / выкладка новой версии

```bash
cd ~/comp-service
git pull
# Пересобрать изменившиеся образы и перезапустить
docker compose up -d --build
```

## 7) Диагностика

-   502 на `/api`: проверьте, что backend жив; `docker compose logs -f backend`
-   Ошибки подключения к БД: проверьте `DATABASE_URL` (в бекенде используется хост `db`, который даёт compose) и здоровье контейнера БД
-   Ошибки JWT: задайте `JWT_SECRET` в `.env`

## 8) Локальная разработка (опционально)

-   Можно поднять через Docker: откройте <http://localhost>
-   Либо без Docker: `npm run dev` во фронтенде и `npm run dev` в бэкенде (с локальным Postgres)

---

В репозитории есть:

-   `frontend/Dockerfile` + конфиг Nginx для SPA и прокси `/api`
-   `backend/Dockerfile` для Node API
-   `docker-compose.yml` для Postgres, Backend и Web
-   `.env.example` и это руководство
