-- SQL-схема для PostgreSQL
-- Без специфичных функций/ограничений: только PK и FK, базовые типы

-- Пользователи системы
CREATE TABLE IF NOT EXISTS users (
    id          SERIAL PRIMARY KEY,
    username    VARCHAR(50) UNIQUE NOT NULL,
    password    TEXT NOT NULL
);

-- Справочники
CREATE TABLE IF NOT EXISTS clients (
    id          SERIAL PRIMARY KEY,
    full_name   TEXT,
    phone       VARCHAR(20),
    email       VARCHAR(150)
);

CREATE TABLE IF NOT EXISTS equipments (
    id      SERIAL PRIMARY KEY,
    client_id INTEGER REFERENCES clients(id),
    model   TEXT,
    type    TEXT
);

CREATE TABLE IF NOT EXISTS services (
    id      SERIAL PRIMARY KEY,
    name    TEXT,
    type    TEXT,
    price   NUMERIC(10,2)
);

CREATE TABLE IF NOT EXISTS components (
    id      SERIAL PRIMARY KEY,
    name    TEXT,
    type    TEXT,
    unit    TEXT,
    price   NUMERIC(10,2)
);

-- Основные сущности
CREATE TABLE IF NOT EXISTS orders (
    id            SERIAL PRIMARY KEY,
    equipment_id INTEGER REFERENCES equipments(id),
    status        TEXT,
    issue         TEXT,
    package       TEXT,
    created_at    TIMESTAMP,
    completed_at  TIMESTAMP
);

-- Связи многие-ко-многим
CREATE TABLE IF NOT EXISTS components_orders (
    order_id     INTEGER REFERENCES orders(id),
    component_id INTEGER REFERENCES components(id),
    quantity     INTEGER,
    price        NUMERIC(10,2),
    PRIMARY KEY (order_id, component_id)
);

CREATE TABLE IF NOT EXISTS services_orders (
    order_id   INTEGER REFERENCES orders(id),
    service_id INTEGER REFERENCES services(id),
    quantity   INTEGER,
    price      NUMERIC(10,2),
    PRIMARY KEY (order_id, service_id)
);
