# CRM API

Backend для интеграции WhatsApp-потока с Dentist Plus.

## О проекте

Этот проект — это backend-обвязка вокруг Dentist Plus для стоматологической клиники.

Сейчас основная идея такая:

- **Dentist Plus** используется как источник данных по пациентам, врачам, расписанию и визитам
- **наш backend** управляет логикой обработки обращений, поиском пациента, подбором свободных слотов и записью на прием
- в дальнейшем сюда подключается WhatsApp-бот и автоматизации по воронкам

---

## Что уже реализовано

На текущем этапе проект уже умеет:

- авторизоваться в Dentist Plus
- получать филиалы
- получать врачей
- искать пациента по номеру телефона
- создавать пациента
- получать расписание врача
- получать визиты врача
- учитывать пагинацию визитов
- рассчитывать свободные слоты по расписанию и занятым визитам
- создавать визит в Dentist Plus
- обрабатывать базовый flow входящего сообщения
- формировать автоматизационные действия по воронкам

---

## Текущая архитектура

### Dentist Plus хранит:
- пациентов
- врачей
- филиалы
- расписание
- визиты

### Backend проекта отвечает за:
- обработку входящих обращений
- поиск или создание пациента
- расчет свободных слотов
- запись пациента на прием
- бизнес-логику воронок
- будущую интеграцию с WhatsApp

---

## Технологии

- Node.js
- TypeScript
- NestJS
- Axios
- Prisma
- PostgreSQL (пока необязателен для основной логики)
- Dentist Plus API

---

## Структура проекта

```bash
src/
  main.ts
  app.module.ts

  config/
    app.config.ts
    dentist.config.ts
    env.ts

  prisma/
    prisma.module.ts
    prisma.service.ts

  modules/
    health/
    automation/
    flow/
    integrations/
      dentist/

prisma/
  schema.prisma
```

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

## Настройка `.env`

Создай файл `.env` в корне проекта.

Пример:

```env
NODE_ENV=development
PORT=3000

DATABASE_URL=postgresql://postgres:postgres@localhost:5432/dentis_crm

DENTIST_API_BASE_URL=https://api2.dentist-plus.com/partner
DENTIST_API_LOGIN=5143_api_partner
DENTIST_API_PASSWORD=YOUR_PASSWORD_HERE

DEFAULT_BRANCH_ID=5061
DEFAULT_PATIENT_LASTNAME=Пациент
```

---

## Prisma

Если база пока не поднята, приложение все равно может запускаться для работы с Dentist Plus API.

Если PostgreSQL уже установлен:

```bash
npx prisma generate
npx prisma db push
```

---

## Запуск проекта

```bash
npm run dev
```

После запуска API будет доступен по адресу:

```text
http://localhost:3000/api
```

---

## Основные endpoints

### Проверка сервера

```http
GET /api/health
```

---

### Dentist Plus

#### Авторизация
```http
GET /api/dentist/auth
```

#### Филиалы
```http
GET /api/dentist/branches
```

#### Врачи
```http
GET /api/dentist/doctors
```

#### Поиск пациентов
```http
GET /api/dentist/patients/search?search=87021949997
```

#### Поиск пациента по номеру
```http
GET /api/dentist/patients/find-by-phone?phone=87021949997
```

#### Создание пациента
```http
POST /api/dentist/patients
```

Пример body:

```json
{
  "firstName": "Тест",
  "lastName": "Пациент",
  "phone": "87770000001",
  "branchId": 5061
}
```

#### Расписание врача
```http
GET /api/dentist/schedule?doctorId=1333473&branchId=5061&dateFrom=2026-03-17&dateTo=2026-03-18
```

#### Визиты врача
```http
GET /api/dentist/visits?doctorId=1333473&branchId=5061&dateFrom=2026-03-17&dateTo=2026-03-18
```

#### Свободные слоты
```http
GET /api/dentist/available-slots?doctorId=1333473&branchId=5061&dateFrom=2026-03-17&dateTo=2026-03-18&slotMinutes=30
```

#### Создание визита
```http
POST /api/dentist/visits
```

Пример body:

```json
{
  "branchId": 5061,
  "patientId": 2252630,
  "doctorId": 1333473,
  "start": "2026-03-18 17:30:00",
  "end": "2026-03-18 18:00:00",
  "description": "Тестовая запись"
}
```

---

## Flow endpoints

### Обработка входящего сообщения

```http
POST /api/flow/incoming-message
```

Пример body:

```json
{
  "phone": "87021949997",
  "message": "Здравствуйте, хочу записаться"
}
```

Что делает:
- ищет пациента по номеру
- если не найден — создает пациента
- возвращает бизнес-действие для дальнейшей обработки

---

### Обработка успешного создания визита

```http
POST /api/flow/visit-created
```

Пример body:

```json
{
  "patientId": 2252630,
  "doctorId": 1333473,
  "branchId": 5061,
  "start": "2026-03-18 17:30:00",
  "end": "2026-03-18 18:00:00"
}
```

---

### Подтверждение прихода пациента

```http
POST /api/flow/patient-arrived
```

---

### Подтверждение неявки пациента

```http
POST /api/flow/patient-no-show
```

---

## Текущая бизнес-логика

### Воронка: Заявки и обращения
- Новый
- Не дозвонились
- Думает
- Записан
- Не пришел
- Пришел
- Отказался
- Неликвид

### Воронка: Планы лечений
- Предварительный
- Подтверждена
- Активен
- Лечение завершено
- Остановлено
- Отказался

### Воронка: Дошедшие и повторные
- Новые
- Назначен куратор
- Создан новый план лечения
- Подписан план лечения
- Начал лечение
- Лечение завершено
- Отказ от лечения

---

## Что важно знать

На текущем этапе в проекте **не используется полноценная CRM-логика через Dentist Plus leads API** как основная база воронки, потому что практическая работа с lead через их API оказалась ограниченной.

Поэтому сейчас проект сфокусирован на надежной части:

- пациент
- расписание
- визиты
- слоты
- запись
- flow обработки обращения

---

## Что планируется дальше

- подключение WhatsApp-клиента
- шаблоны сообщений пациентам
- напоминания за 24 часа и за 2 часа до визита
- автоматизация статусов по событиям
- подтверждение/перенос/отмена записи
- внутренняя логика воронок поверх flow
- при необходимости отдельное локальное хранилище состояний

---

## Примеры полезных запросов

### Проверка сервера
```bash
curl http://localhost:3000/api/health
```

### Входящее сообщение
```bash
curl -X POST "http://localhost:3000/api/flow/incoming-message" ^
  -H "Content-Type: application/json" ^
  -d "{\"phone\":\"87021949997\",\"message\":\"Здравствуйте, хочу записаться\"}"
```

### Свободные слоты
```bash
curl "http://localhost:3000/api/dentist/available-slots?doctorId=1333473&branchId=5061&dateFrom=2026-03-17&dateTo=2026-03-18&slotMinutes=30"
```

---

## Статус проекта

Проект находится в активной разработке.

Сейчас уже реализовано рабочее ядро записи через Dentist Plus API.
