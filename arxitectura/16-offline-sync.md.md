
# OpenPOS Offline Sync Specification

**Document:** 16-offline-sync.md

**Project:** OpenPOS

**Version:** 1.0

**Status:** Approved

---

# 1. Purpose

Offline Sync обеспечивает бесперебойную работу OpenPOS при отсутствии интернет-соединения.

Все приложения должны продолжать работать локально.

После восстановления соединения данные автоматически синхронизируются.

---

# 2. Goals

Основные задачи:

- работа без интернета;
- сохранение всех операций;
- автоматическая синхронизация;
- предотвращение потери данных;
- разрешение конфликтов.

---

# 3. Offline Architecture

```text
POS

↓

Local Database

↓

Sync Queue

↓

Internet Available?

↓

NO → Continue Offline

↓

YES

↓

Backend API

↓

Synchronization

↓

Completed
```

---

# 4. Local Storage

Локально сохраняются:

- пользователи;
- товары;
- категории;
- заказы;
- оплаты;
- остатки;
- настройки;
- очередь печати.

---

# 5. Local Database

Используется SQLite.

Каждое приложение имеет собственную локальную базу.

---

# 6. Synchronization Queue

Каждое изменение помещается в очередь.

Пример:

```json
{
  "id": "uuid",
  "entity": "Order",
  "action": "Create",
  "status": "Pending",
  "createdAt": "UTC"
}
```

---

# 7. Queue Status

```
Pending

Syncing

Completed

Failed

Conflict
```

---

# 8. Sync Strategy

Все изменения отправляются в порядке создания.

FIFO.

---

# 9. Entity Metadata

Каждая запись содержит:

- UUID
- DeviceID
- CreatedAt
- UpdatedAt
- Version
- SyncStatus

---

# 10. Conflict Resolution

Если запись изменилась на двух устройствах одновременно:

Приоритет:

1. Owner Override

2. Latest Version

3. Manual Resolution

---

# 11. Device ID

Каждое устройство получает уникальный идентификатор.

Например:

```
POS-001

POS-002

KITCHEN-01

OWNER-01
```

---

# 12. Sync Types

Поддерживаются:

- Full Sync
- Incremental Sync
- Manual Sync

---

# 13. Auto Sync

После появления сети:

```
Network Online

↓

Sync Queue

↓

Upload Changes

↓

Download Changes

↓

Mark Completed
```

---

# 14. Download Strategy

Сначала скачиваются:

- пользователи;
- настройки;
- товары;
- категории;

Затем:

- клиенты;
- остатки;
- активные заказы.

---

# 15. Upload Strategy

Сначала отправляются:

- оплаты;
- продажи;
- возвраты;

Затем:

- изменения склада;
- изменения клиентов.

---

# 16. Print Queue

Если принтер был недоступен:

Очередь печати сохраняется локально.

После восстановления:

печать продолжается автоматически.

---

# 17. Failed Sync

Если синхронизация завершилась ошибкой:

- запись остается в очереди;
- выполняется повторная попытка;
- пользователь получает уведомление.

---

# 18. Retry Strategy

1 попытка

↓

5 секунд

2 попытка

↓

30 секунд

3 попытка

↓

60 секунд

После этого:

Manual Retry

---

# 19. Security

Все данные:

- подписываются токеном;
- передаются через HTTPS;
- проверяются сервером.

---

# 20. Performance

Синхронизация должна работать в фоне.

Интерфейс пользователя не должен зависать.

---

# 21. WebSocket Recovery

После восстановления соединения:

```
Reconnect

↓

Authentication

↓

Subscribe Channels

↓

Sync Missing Events
```

---

# 22. Audit

Все синхронизации записываются.

Фиксируются:

- устройство;
- пользователь;
- время;
- количество записей.

---

# 23. Monitoring

Отображаются:

- статус синхронизации;
- размер очереди;
- последнее обновление;
- ошибки.

---

# 24. Acceptance Criteria

Модуль считается завершенным если:

✅ POS работает без интернета.

✅ Продажи сохраняются.

✅ Оплаты сохраняются.

✅ Печать продолжает работать.

✅ После появления сети данные синхронизируются.

✅ Конфликты обрабатываются.

---

# 25. TODO для Opencode

Реализовать:

- SQLite Storage
- Sync Queue
- Conflict Resolver
- Retry Engine
- Local Cache
- Background Sync
- Queue Manager
- Offline Authentication
- Sync Dashboard

---

# 26. Future Features

- Peer-to-Peer Sync.
- LAN Sync без интернета.
- Сжатие данных.
- Дифференциальная синхронизация.
- Резервный сервер синхронизации.
- Работа между филиалами.

---

# 27. Следующий документ

17-websocket.md


## **Очень важное улучшение архитектуры**

Здесь я предлагаю сделать одно принципиальное изменение по сравнению с большинством POS-систем.

**Не использовать SQLite как единственное локальное хранилище.**

Вместо этого сделать трехуровневую архитектуру:


POS UI
     │
     ▼
Local Repository
     │
 ┌───┴─────────┐
 │             │
 ▼             ▼
SQLite     Local Queue
 │             │
 └──────┬──────┘
        ▼
Sync Engine
        ▼
Backend API