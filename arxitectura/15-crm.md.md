
# OpenPOS CRM Specification

**Document:** 15-crm.md

**Project:** OpenPOS

**Version:** 1.0

**Status:** Approved

---

# 1. Purpose

CRM (Customer Relationship Management) предназначена для хранения информации о клиентах, истории покупок, бонусах, скидках и взаимодействиях.

Модуль должен одинаково хорошо работать для кафе, ресторанов и магазинов.

---

# 2. Goals

Основные задачи:

- хранение базы клиентов;
- история покупок;
- бонусная система;
- программы лояльности;
- персональные скидки;
- сегментация клиентов;
- аналитика.

---

# 3. Main Modules

```
CRM

├── Customers
├── Loyalty
├── Bonus Points
├── Discounts
├── Customer Groups
├── Purchase History
├── Wallet
├── Marketing
└── Analytics
```

---

# 4. Customer Card

Карточка клиента содержит:

- ID
- Имя
- Фамилия
- Телефон
- Email
- Дата рождения
- Пол
- Адрес
- Комментарий
- Фото (Future)

---

# 5. Customer Status

Статусы:

```
New

Regular

VIP

Blocked
```

---

# 6. Customer Groups

Поддерживаются группы:

- Обычный
- Постоянный
- VIP
- Оптовый
- Сотрудник

Для каждой группы можно задать свои скидки и бонусные правила.

---

# 7. Loyalty Program

Поддерживаются:

- накопительные бонусы;
- фиксированные бонусы;
- кэшбэк;
- скидка по уровню клиента.

---

# 8. Bonus System

Каждый клиент имеет бонусный баланс.

Пример:

```
Баланс:

1250 бонусов
```

Можно:

- начислять;
- списывать;
- отменять начисление.

---

# 9. Discount Rules

Поддерживаются:

- процентная скидка;
- фиксированная скидка;
- скидка на категорию;
- скидка на товар;
- скидка по времени;
- скидка по дню рождения.

---

# 10. Purchase History

Для каждого клиента хранится:

- дата покупки;
- номер заказа;
- сумма;
- способ оплаты;
- кассир;
- товары.

---

# 11. Favorite Products

CRM автоматически определяет:

- любимые товары;
- самые частые покупки;
- средний чек.

---

# 12. Wallet

Для каждого клиента отображаются:

- бонусы;
- доступные скидки;
- сертификаты (Future);
- подарочные карты (Future).

---

# 13. Search

Поиск осуществляется по:

- имени;
- телефону;
- Email;
- номеру карты;
- QR-коду (Future).

---

# 14. Marketing (Future)

Поддерживаются:

- SMS-рассылки;
- Email-рассылки;
- Push-уведомления;
- Telegram;
- WhatsApp.

---

# 15. Customer Analytics

Показываются:

- количество покупок;
- общая сумма;
- средний чек;
- последний визит;
- частота покупок.

---

# 16. Customer Timeline

Лента событий:

```
Регистрация

↓

Первая покупка

↓

Начислены бонусы

↓

Использована скидка

↓

Возврат товара
```

---

# 17. API

```
GET /customers

POST /customers

PATCH /customers/:id

DELETE /customers/:id

GET /customers/:id/history

POST /customers/:id/bonus

POST /customers/:id/discount
```

---

# 18. WebSocket Events

```
customer.created

customer.updated

customer.deleted

bonus.updated

loyalty.updated
```

---

# 19. Security

Доступ имеют:

- Owner
- Administrator
- Cashier (ограниченно)

Все изменения логируются.

---

# 20. Performance

Поиск клиента:

< 100 мс

Открытие карточки:

< 300 мс

Начисление бонусов:

< 200 мс

---

# 21. Acceptance Criteria

Модуль считается завершенным если:

✅ Работает база клиентов.

✅ Работают бонусы.

✅ Работают скидки.

✅ Работает история покупок.

✅ Работает аналитика.

---

# 22. TODO для Opencode

Реализовать:

- Customer Module
- Loyalty Module
- Bonus Engine
- Discount Engine
- Customer Search
- Purchase History
- Customer Groups
- CRM Dashboard
- Analytics

---

# 23. Future Features

- AI-анализ поведения клиентов.
- Автоматические персональные предложения.
- RFM-анализ клиентов.
- Предсказание оттока клиентов.
- Интеграция с Telegram и WhatsApp.
- Электронные карты лояльности.

---

# 24. Следующий документ

16-offline-sync.md