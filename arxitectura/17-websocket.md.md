

# OpenPOS WebSocket Specification

**Document:** 17-websocket.md

**Project:** OpenPOS

**Version:** 1.0

**Status:** Approved

---

# 1. Purpose

WebSocket обеспечивает обмен событиями в реальном времени между всеми приложениями OpenPOS.

Все изменения должны доставляться практически мгновенно.

---

# 2. Goals

Основные задачи:

- обновление заказов;
- обновление кухни;
- уведомления;
- синхронизация между кассами;
- мониторинг принтеров;
- обновление Dashboard;
- обновление мобильного приложения владельца.

---

# 3. Architecture

```text
                WebSocket Server
                      │
 ┌──────────┬─────────┼─────────┬──────────┐
 │          │         │         │          │
 ▼          ▼         ▼         ▼          ▼
POS      Kitchen   Dashboard  Mobile   Print Service
```

---

# 4. Protocol

Используется:

```
Socket.IO
```

Транспорт:

- WebSocket
- Polling (Fallback)

---

# 5. Authentication

После подключения клиент отправляет JWT.

```
Client

↓

Connect

↓

JWT Validation

↓

Success

↓

Join Rooms
```

Без успешной авторизации соединение закрывается.

---

# 6. Rooms

Поддерживаются комнаты:

```
company:{id}

branch:{id}

cashier:{id}

kitchen

printer

dashboard

owner
```

Пример:

```
company:1

branch:3

kitchen
```

---

# 7. Event Naming

Все события используют единый формат:

```
entity.action
```

Пример:

```
order.created

order.updated

order.deleted

payment.completed

inventory.updated

printer.failed
```

---

# 8. Order Events

```
order.created

order.updated

order.cancelled

order.ready

order.completed
```

---

# 9. Kitchen Events

```
kitchen.new

kitchen.accepted

kitchen.preparing

kitchen.ready
```

---

# 10. Printer Events

```
printer.online

printer.offline

printer.completed

printer.failed

printer.paper_out

printer.cover_open
```

---

# 11. Inventory Events

```
inventory.updated

inventory.low_stock

inventory.transfer
```

---

# 12. CRM Events

```
customer.created

customer.updated

bonus.updated

loyalty.updated
```

---

# 13. Dashboard Events

```
dashboard.sales

dashboard.orders

dashboard.inventory

dashboard.notifications
```

---

# 14. Notification Events

```
notification.created

notification.read
```

---

# 15. Event Structure

Все события имеют одинаковый формат.

```json
{
  "event": "order.created",
  "timestamp": "2026-07-23T10:20:00Z",
  "companyId": "uuid",
  "branchId": "uuid",
  "data": {}
}
```

---

# 16. Reconnection

При потере соединения:

```
Disconnect

↓

Reconnect

↓

JWT Validation

↓

Join Rooms

↓

Sync Missed Events
```

---

# 17. Heartbeat

Каждые 30 секунд:

```
PING

↓

PONG
```

Если ответ отсутствует:

соединение закрывается.

---

# 18. Delivery Guarantee

Каждое событие имеет:

- Event ID
- Timestamp
- Retry Count

Событие считается обработанным только после подтверждения (ACK).

---

# 19. Offline Recovery

Если клиент был офлайн:

после подключения сервер отправляет пропущенные события.

---

# 20. Performance

Время доставки события:

< 100 мс (локальная сеть)

< 300 мс (через интернет)

---

# 21. Security

Все события проходят:

- JWT Validation
- RBAC
- Проверку принадлежности к компании и филиалу

Клиент не может подписаться на чужие комнаты.

---

# 22. Logging

Логируются:

- подключение;
- отключение;
- ошибки;
- отправка событий;
- подтверждение доставки.

---

# 23. Monitoring

Отображаются:

- количество активных подключений;
- количество комнат;
- задержка;
- потерянные события;
- количество повторных отправок.

---

# 24. Acceptance Criteria

Модуль считается завершенным если:

✅ POS получает новые события.

✅ Kitchen получает заказы.

✅ Dashboard обновляется автоматически.

✅ Print Service получает задания.

✅ Работает переподключение.

✅ Работает подтверждение доставки (ACK).

---

# 25. TODO для Opencode

Реализовать:

- Socket.IO Server
- Socket.IO Client
- JWT Authentication
- Room Manager
- Event Dispatcher
- ACK System
- Reconnection Manager
- Heartbeat
- Monitoring
- Event Logger

---

# 26. Future Features

- Горизонтальное масштабирование через Redis Adapter.
- Push-уведомления.
- Server-to-Server Events.
- Event Replay.
- Event Bus.
- Kafka Integration (при необходимости).

---

# 27. Следующий документ

18-deployment.md