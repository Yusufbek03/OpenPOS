# OpenPOS Print Service Specification

**Document:** 12-print-service.md

**Project:** OpenPOS

**Version:** 1.0

**Status:** Approved

---

# 1. Purpose

Print Service — отдельный сервис OpenPOS, отвечающий за печать всех документов.

Сервис работает независимо от POS, Kitchen Display и Dashboard.

Даже если POS закрыт, сервис должен продолжать печатать документы из очереди.

---

# 2. Goals

Основные задачи:

- автоматическая печать чеков;
- печать кухонных чеков;
- повторная печать;
- очередь печати;
- поддержка нескольких принтеров;
- мониторинг состояния принтеров.

---

# 3. Architecture

```text
POS
 │
 ▼
Backend API
 │
 ▼
Print Queue
 │
 ▼
Print Service
 │
 ├──────────────► Cashier Printer
 │
 ├──────────────► Kitchen Printer
 │
 ├──────────────► Bar Printer
 │
 └──────────────► Receipt Printer
```

---

# 4. Supported Printers

Версия 1.0

- USB ESC/POS
- LAN ESC/POS

Будущие версии

- Bluetooth
- Wi-Fi Direct
- Star Printer
- Epson TM Series
- Sunmi Printer

---

# 5. Print Queue

Каждое задание помещается в очередь.

Структура задания:

```json
{
  "id": "uuid",
  "printer": "Kitchen-01",
  "type": "KitchenTicket",
  "status": "Pending",
  "createdAt": "UTC"
}
```

---

# 6. Queue States

```
Pending

Printing

Completed

Failed

Cancelled
```

---

# 7. Retry Policy

Если печать не удалась:

1 попытка

↓

5 секунд

2 попытка

↓

10 секунд

3 попытка

↓

30 секунд

После этого статус:

FAILED

---

# 8. Receipt Types

Поддерживаются:

- кассовый чек;
- кухонный чек;
- чек бара;
- чек десертов;
- возврат;
- X-отчет;
- Z-отчет.

---

# 9. Receipt Layout

Чек содержит:

- логотип;
- название компании;
- адрес;
- ИНН;
- номер заказа;
- список товаров;
- количество;
- цену;
- сумму;
- скидку;
- налог;
- итог;
- QR-код;
- дату;
- время;
- кассира.

---

# 10. Kitchen Ticket

Кухонный чек содержит:

- номер заказа;
- стол;
- официанта;
- список блюд;
- комментарии;
- время создания.

Цены не печатаются.

---

# 11. Split Printing

Каждый товар связан с отделом.

Пример:

```
Burger

↓

Kitchen Printer

Coffee

↓

Bar Printer

Cake

↓

Dessert Printer
```

---

# 12. Printer Profiles

Каждый принтер хранит:

- имя;
- IP-адрес;
- порт;
- тип;
- ширину бумаги;
- кодировку;
- статус.

---

# 13. ESC/POS Support

Поддерживается:

- текст;
- жирный шрифт;
- центрирование;
- QR-коды;
- штрихкоды;
- открытие денежного ящика;
- частичная обрезка бумаги.

---

# 14. Cash Drawer

После успешной оплаты наличными:

```
Payment Success

↓

Open Cash Drawer

↓

Print Receipt
```

---

# 15. Print Templates

Используются шаблоны.

Например:

- Receipt Template
- Kitchen Template
- Return Template
- Report Template

Шаблоны не должны быть "зашиты" в код.

---

# 16. Printer Status

Статусы:

```
Online

Offline

Busy

Error

Paper Out

Cover Open
```

---

# 17. Monitoring

Print Service постоянно проверяет:

- доступность принтеров;
- очередь;
- ошибки;
- время печати.

---

# 18. Offline Mode

Если Backend недоступен:

- очередь сохраняется локально;
- после восстановления соединения задания продолжают печататься.

---

# 19. Security

Print Service принимает задания только от Backend API.

Прямая отправка заданий запрещена.

---

# 20. Logging

Логируются:

- отправка задания;
- успешная печать;
- ошибка;
- повторная попытка;
- отмена задания.

---

# 21. Performance

Создание задания

< 50 мс

Начало печати

< 500 мс

---

# 22. Error Handling

Если принтер отключился:

- показать предупреждение;
- оставить задание в очереди;
- повторить автоматически.

Если бумага закончилась:

- остановить очередь;
- уведомить пользователя.

---

# 23. API

```
POST /print

GET /print/jobs

GET /print/printers

POST /print/retry

POST /print/test

DELETE /print/jobs/:id
```

---

# 24. WebSocket Events

```
printer.online

printer.offline

printer.completed

printer.failed

printer.paper_out

printer.cover_open
```

---

# 25. Acceptance Criteria

Модуль считается завершенным если:

✅ Работает очередь.

✅ Работает повторная печать.

✅ Работают несколько принтеров.

✅ Работает разделение чеков.

✅ Работает ESC/POS.

✅ Работает открытие денежного ящика.

---

# 26. TODO для Opencode

Необходимо реализовать:

- Print Queue
- Printer Manager
- ESC/POS Driver
- LAN Driver
- USB Driver
- Template Engine
- Retry Engine
- Monitoring
- WebSocket Client
- Cash Drawer Module

---

# 27. Future Features

- PDF-печать.
- Email-чек.
- SMS-чек.
- Bluetooth-принтеры.
- Облачная очередь печати.
- Печать через Android.

---

# 28. Следующий документ

13-dashboard.md



## **Важное архитектурное решение**

Для OpenPOS я предлагаю **не печатать напрямую из POS**.

Правильная схема будет такой:

POS
   ↓
Backend API
   ↓
Print Queue
   ↓
Print Service
   ↓
Printer
