# CRM API

Backend внешней CRM для стоматологии с интеграцией с Dentist Plus.

## О проекте

Этот проект создается как отдельная CRM-обвязка, которая работает поверх Dentist Plus.

### Наша CRM отвечает за:
- лиды и обращения
- карточку пациента
- историю сообщений
- статусы и воронку
- задачи
- локальные записи
- интеграцию с WhatsApp

### Dentist Plus используется как внешний источник данных:
- пациенты
- врачи
- филиалы
- расписание
- визиты

---

## Текущий статус

Сейчас в проекте уже есть:

- базовый NestJS backend
- health endpoint
- конфигурация через `.env`
- Prisma client
- мягкий запуск приложения даже без активной БД
- базовая интеграция с Dentist Plus
- тестовые endpoints для проверки Dentist Plus API

### Доступные endpoints
- `GET /api/health`
- `GET /api/dentist/auth`
- `GET /api/dentist/branches`
- `GET /api/dentist/doctors`

---

## Технологии

- Node.js
- NestJS
- TypeScript
- Prisma
- PostgreSQL
- Axios

В дальнейшем планируется:
- Redis
- BullMQ
- WhatsApp integration
- админка

---

## Структура проекта

```bash
src/
  main.ts
  app.module.ts

  config/
    env.ts
    app.config.ts
    dentist.config.ts

  common/
    utils/
    constants/
    types/
    enums/

  prisma/
    prisma.module.ts
    prisma.service.ts

  modules/
    health/
    patients/
    leads/
    conversations/
    messages/
    doctors/
    branches/
    schedule/
    appointments/
    whatsapp/
    integrations/
      dentist/

prisma/
  schema.prisma
```

---

## Требования

Перед запуском убедись, что у тебя установлены:

- Node.js 20+
- npm
- PostgreSQL
- Git

---

## Установка

### 1. Клонировать проект

```bash
git clone https://github.com/restemade/crm-api.git
cd crm-api
```

### 2. Установить зависимости

```bash
npm install
```

---

## Настройка окружения

### 1. Создай файл `.env` в корне проекта

Пример:

```env
NODE_ENV=development
PORT=3000

DATABASE_URL=postgresql://postgres:postgres@localhost:5432/dentis_crm

DENTIST_API_BASE_URL=https://api2.dentist-plus.com/partner
DENTIST_API_LOGIN=
DENTIST_API_PASSWORD=

DEFAULT_BRANCH_ID=1
DEFAULT_PATIENT_LASTNAME=Unknown
```

### 2. Заполни переменные

#### Основные
- `PORT` — порт запуска приложения
- `DATABASE_URL` — строка подключения к PostgreSQL

#### Dentist Plus
- `DENTIST_API_BASE_URL` — базовый URL partner API
- `DENTIST_API_LOGIN` — логин API
- `DENTIST_API_PASSWORD` — пароль API

---

## Prisma

### Сгенерировать Prisma client

```bash
npx prisma generate
```

### Если база уже поднята, можно применить схему

```bash
npx prisma db push
```

или позже через миграции:

```bash
npx prisma migrate dev
```

---

## Запуск проекта

### Development режим

```bash
npm run dev
```

После запуска сервер будет доступен по адресу:

```text
http://localhost:3000/api
```

---

## Проверка работы

### Health check

Открой в браузере:

```text
http://localhost:3000/api/health
```

Ожидаемый ответ:

```json
{
  "ok": true,
  "service": "crm-api",
  "timestamp": "2026-03-13T10:33:40.091Z"
}
```

---

## Проверка Dentist Plus integration

### Авторизация
```text
GET /api/dentist/auth
```

### Филиалы
```text
GET /api/dentist/branches
```

### Врачи
```text
GET /api/dentist/doctors
```

### Важно
Если `/api/dentist/auth` возвращает `401 Unauthorized` или ошибку про неверный логин/пароль, значит проблема в Dentist Plus credentials, а не в backend-коде.

---

## Работа с PostgreSQL

Сейчас приложение умеет запускаться даже если PostgreSQL временно недоступен.

Это сделано специально, чтобы можно было продолжать разработку интеграции и модулей, не блокируясь на инфраструктуре.

Но для полноценной работы CRM дальше обязательно нужен запущенный PostgreSQL.

---

## Возможные проблемы

### 1. Prisma не подключается к БД
Ошибка вида:

```text
Can't reach database server at localhost:5432
```

Что проверить:
- запущен ли PostgreSQL
- правильный ли `DATABASE_URL`
- существует ли база `dentis_crm`

---

### 2. Dentist Plus auth не проходит
Если видишь ошибку вида:

```json
{
  "error": "Неверные логин / пароль"
}
```

Это значит:
- endpoint рабочий
- запрос уходит правильно
- проблема именно в API-учетных данных

---

### 3. Не запускается `git`
Если Windows не распознает команду `git`, нужно установить Git for Windows и добавить его в PATH.

---

## Что дальше

Следующие этапы разработки:

- поднять PostgreSQL
- описать `schema.prisma`
- реализовать локальные сущности:
  - Patient
  - Lead
  - Conversation
  - Message
  - Appointment
- реализовать поиск пациента
- реализовать создание пациента
- реализовать получение расписания
- реализовать создание записи
- подключить WhatsApp

---

## Планируемый сценарий работы

1. Пользователь пишет в WhatsApp
2. Система определяет номер телефона
3. Ищет пациента в локальной CRM
4. Если не найден — ищет в Dentist Plus
5. Если не найден в Dentist Plus — создает нового пациента
6. Получает врачей и доступное время
7. Создает запись
8. Связывает запись с локальной CRM и Dentist Plus

---

## Примечание

Проект находится в активной разработке.
Часть модулей пока существует как архитектурная структура и будет реализовываться поэтапно.
