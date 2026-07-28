
# OpenPOS API Specification

**Document:** 09-api.md

**Project:** OpenPOS

**Version:** 1.0

**Status:** Approved

---

# 1. Purpose

Документ описывает стандарт разработки REST API OpenPOS.

Все приложения (POS, Dashboard, Kitchen, Mobile) работают только через API.

Прямой доступ к базе данных запрещен.

---

# 2. API Versioning

Все запросы используют версию API.

Пример

```
/api/v1/auth/login

/api/v1/products

/api/v1/orders

/api/v1/customers
```

При несовместимых изменениях создается новая версия:

```
/api/v2/
```

---

# 3. API Principles

Каждый endpoint должен:

- быть предсказуемым;
- использовать HTTP-стандарты;
- возвращать JSON;
- поддерживать пагинацию при списках;
- логироваться;
- проверять права доступа.

---

# 4. HTTP Methods

GET

Получение данных.

POST

Создание.

PUT

Полное обновление.

PATCH

Частичное обновление.

DELETE

Удаление (Soft Delete).

---

# 5. Standard Response

Все успешные ответы имеют одинаковый формат.

```json
{
  "success": true,
  "message": "Success",
  "data": {},
  "meta": {}
}
```

---

# 6. Error Response

```json
{
  "success": false,
  "message": "Validation Error",
  "error": {
    "code": "VALIDATION_ERROR",
    "details": []
  }
}
```

---

# 7. HTTP Status Codes

200 OK

201 Created

204 No Content

400 Bad Request

401 Unauthorized

403 Forbidden

404 Not Found

409 Conflict

422 Validation Error

500 Internal Server Error

---

# 8. Authentication

Все защищенные маршруты используют

```
Authorization: Bearer <token>
```

---

# 9. Pagination

Запрос

```
GET /products?page=1&limit=20
```

Ответ

```json
{
  "success": true,
  "data": [],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 540,
    "pages": 27
  }
}
```

---

# 10. Sorting

```
GET /products?sort=name

GET /products?sort=-price
```

"-" означает сортировку по убыванию.

---

# 11. Filtering

```
GET /products?category=coffee

GET /products?active=true

GET /orders?status=paid
```

---

# 12. Search

```
GET /products/search?q=cola

GET /customers/search?q=99890
```

Поиск должен быть быстрым.

---

# 13. API Modules

## Authentication

```
POST /auth/login

POST /auth/logout

POST /auth/refresh
```

---

## Users

```
GET /users

POST /users

PATCH /users/:id

DELETE /users/:id
```

---

## Products

```
GET /products

POST /products

GET /products/:id

PATCH /products/:id

DELETE /products/:id
```

---

## Categories

```
GET /categories

POST /categories

PATCH /categories/:id

DELETE /categories/:id
```

---

## Orders

```
GET /orders

POST /orders

GET /orders/:id

PATCH /orders/:id

DELETE /orders/:id
```

---

## Payments

```
POST /payments

GET /payments
```

---

## Customers

```
GET /customers

POST /customers

PATCH /customers/:id
```

---

## Inventory

```
GET /inventory

POST /inventory/receive

POST /inventory/writeoff

POST /inventory/transfer
```

---

## Reports

```
GET /reports/daily

GET /reports/monthly

GET /reports/sales
```

---

# 14. Validation

Все входящие данные проходят проверку.

Используется:

- DTO
- class-validator
- class-transformer

---

# 15. File Upload

```
POST /upload
```

Поддерживаются:

- JPG
- PNG
- WEBP

Максимальный размер:

10 MB

---

# 16. WebSocket Events

Backend отправляет события.

```
order.created

order.updated

order.ready

payment.completed

inventory.updated

printer.completed

printer.failed
```

---

# 17. Idempotency

Для критичных операций используется заголовок:

```
Idempotency-Key
```

Это предотвращает повторное списание средств или двойное создание заказа при повторном запросе.

---

# 18. Audit Logging

Все изменения логируются:

- кто выполнил;
- когда;
- с какого устройства;
- что изменилось.

---

# 19. Rate Limiting

Для защиты API:

- Login — 10 запросов/минуту
- Остальные маршруты — 120 запросов/минуту

---

# 20. OpenAPI

Все маршруты документируются через Swagger.

```
/api/docs
```

---

# 21. Definition of Done

API считается готовым если:

✅ Все маршруты используют единый формат ответа.

✅ Все защищенные маршруты требуют JWT.

✅ Все маршруты имеют Swagger.

✅ Все DTO валидируются.

✅ Все ошибки стандартизированы.

✅ Все действия логируются.

---

# 22. TODO для Opencode

Реализовать:

- REST API
- Swagger
- DTO
- Validation
- Exception Filters
- Response Interceptor
- Pagination
- Search
- Sorting
- Filtering
- Audit Logger
- Rate Limiter
- WebSocket Events

---

# 23. Следующий документ

10-pos-module.md