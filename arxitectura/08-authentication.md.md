
# OpenPOS Authentication & Authorization Specification

**Document:** 08-authentication.md

**Project:** OpenPOS

**Version:** 1.0

**Status:** Approved

---

# 1. Цель

Данный документ описывает всю систему аутентификации и авторизации OpenPOS.

Документ обязателен для Backend, Frontend, Mobile и Desktop приложений.

Все приложения используют единую систему безопасности.

---

# 2. Основные принципы

OpenPOS должен обеспечивать

- безопасную авторизацию
- быстрый вход
- Offline Login
- защиту от взлома
- разграничение прав
- журналирование действий пользователей

---

# 3. Типы входа

На первой версии поддерживаются

✅ Email + Password

✅ Username + Password

✅ PIN Code

Будущие версии

- QR Login
- NFC Card
- RFID Card
- Fingerprint
- Face Recognition

---

# 4. Пользовательские роли

В системе существуют следующие роли.

## Owner

Полный доступ ко всему.

Может

- создавать филиалы
- менять настройки
- удалять пользователей
- смотреть финансовые отчеты

---

## Administrator

Управляет заведением.

Может

- создавать сотрудников
- менять товары
- управлять складом
- смотреть аналитику

Не может

- удалить владельца
- изменить лицензию

---

## Cashier

Работает только с продажами.

Может

- открыть смену
- продавать
- делать возврат (при наличии разрешения)
- печатать чек

Не может

- менять цены
- удалять товары
- управлять пользователями

---

## Waiter

Может

- открыть стол
- добавить заказ
- отправить заказ на кухню
- закрыть заказ

---

## Cook

Может

- видеть новые заказы
- менять статус заказа
- печатать кухонный чек

---

## Warehouse Manager

Может

- приходовать товар
- списывать товар
- проводить инвентаризацию

---

## Accountant

Может

- смотреть финансовые отчеты
- экспортировать данные

---

# 5. Permission System

Используется RBAC.

Role

↓

Permissions

↓

Action

Пример

```
Administrator

↓

product.create

↓

Разрешено
```

---

# 6. Пример Permission

```
product.read

product.create

product.update

product.delete

order.create

order.update

order.cancel

inventory.read

inventory.write

crm.read

crm.update

dashboard.read

report.export

printer.manage

user.manage

settings.manage
```

---

# 7. Авторизация

Backend использует

JWT Access Token

+

Refresh Token

После успешного входа сервер возвращает

```
{
  accessToken,
  refreshToken,
  expiresIn
}
```

---

# 8. JWT

Access Token

Живет

15 минут

Refresh Token

Живет

30 дней

---

# 9. Password Policy

Минимум

8 символов

Обязательно

- буква
- цифра

Рекомендуется

- спецсимвол

Пароль хранится только в Hash.

Используется

bcrypt

---

# 10. Login Flow

```text
User

↓

POST /auth/login

↓

Validate Password

↓

Create JWT

↓

Create Refresh Token

↓

Return Tokens
```

---

# 11. Refresh Flow

```text
Client

↓

Refresh Token

↓

Backend

↓

Validate

↓

Generate New Access Token

↓

Return Access Token
```

---

# 12. Logout

При выходе

Refresh Token удаляется

JWT становится недействительным после окончания срока жизни.

---

# 13. Offline Login

После первого успешного входа

локально сохраняются

- User ID
- Role
- Permissions
- Encrypted Credentials

При отсутствии сети

POS позволяет войти локально.

После появления сети

происходит повторная проверка.

---

# 14. Session Management

Каждый вход создает новую сессию.

Хранятся

- Device ID
- IP
- Login Time
- Last Activity

Owner может завершить любую сессию.

---

# 15. Device Registration

Каждый POS имеет уникальный Device ID.

Пример

```
POS-001

POS-002

KITCHEN-01
```

Это необходимо для Offline режима и аудита.

---

# 16. Audit Log

Записываются

- Login
- Logout
- Failed Login
- Password Change
- User Created
- User Deleted
- Permission Changed

Все действия сохраняются.

---

# 17. Failed Login Protection

После

5

неудачных попыток

аккаунт блокируется

на

15 минут

---

# 18. API Endpoints

POST /auth/login

POST /auth/logout

POST /auth/refresh

POST /auth/change-password

POST /auth/reset-password

GET /auth/me

---

# 19. Database Tables

Используются

users

roles

permissions

role_permissions

sessions

refresh_tokens

audit_logs

devices

---

# 20. Frontend Requirements

После запуска приложения

если Access Token истек

↓

автоматически выполняется Refresh.

Если Refresh невозможен

↓

открывается экран Login.

---

# 21. Backend Requirements

Все защищенные маршруты используют

JWT Guard

+

Permission Guard

Никаких исключений.

---

# 22. Security Rules

Запрещено

❌ хранить пароль открытым текстом

❌ хранить JWT в LocalStorage (для Web)

❌ отключать проверку прав

❌ использовать один пароль для всех пользователей

---

# 23. Acceptance Criteria

Модуль считается завершенным если

✅ Login работает

✅ Logout работает

✅ Refresh работает

✅ RBAC работает

✅ Offline Login работает

✅ Audit Log работает

✅ Device Registration работает

---

# 24. TODO для Opencode

Необходимо реализовать

- Auth Module

- JWT Module

- Refresh Token Module

- RBAC

- Guards

- Decorators

- Audit Logger

- Session Manager

- Device Manager

- Offline Login

---

# 25. Следующий документ

09-api.md