
# OpenPOS Security Specification

**Document:** 20-security.md

**Project:** OpenPOS

**Version:** 1.0

**Status:** Approved

---

# 1. Purpose

Данный документ определяет требования безопасности для всех компонентов OpenPOS.

Безопасность распространяется на:

- Backend API
- Dashboard
- POS
- Kitchen Display
- Print Service
- Offline Storage
- WebSocket
- Database
- Mobile Client (Future)

---

# 2. Security Principles

Основные принципы:

- Least Privilege
- Zero Trust
- Defense in Depth
- Secure by Default
- Fail Secure

---

# 3. Authentication

Поддерживаются:

- JWT Access Token
- Refresh Token
- PIN Login
- Offline Login

Все токены подписываются секретным ключом.

---

# 4. Authorization

Используется RBAC.

Каждый запрос проверяет:

- пользователя;
- роль;
- разрешение;
- филиал;
- компанию.

---

# 5. Password Security

Пароли никогда не хранятся открытым текстом.

Используется:

- bcrypt (12+ rounds)

Требования:

- минимум 8 символов;
- минимум одна цифра;
- минимум одна буква.

---

# 6. HTTPS

Все соединения используют HTTPS.

Запрещено:

- HTTP в Production;
- Self-Signed сертификаты без явного разрешения администратора.

---

# 7. JWT

Access Token:

15 минут.

Refresh Token:

30 дней.

JWT содержит:

- User ID
- Company ID
- Branch ID
- Role
- Session ID

---

# 8. Session Management

Каждая авторизация создает новую сессию.

Сохраняются:

- Device ID
- IP
- User Agent
- Login Time
- Last Activity

---

# 9. Brute Force Protection

После:

5 неудачных попыток

аккаунт блокируется на:

15 минут.

---

# 10. API Security

Все API:

- используют JWT;
- проверяют RBAC;
- валидируют DTO;
- журналируют запросы.

---

# 11. Input Validation

Все входящие данные проходят:

- Validation;
- Sanitization;
- Type Checking.

---

# 12. SQL Injection Protection

Запрещены:

- Raw SQL без параметров;
- конкатенация SQL-запросов.

Используются:

- Prisma ORM;
- параметризованные запросы.

---

# 13. XSS Protection

Все пользовательские данные экранируются.

HTML от пользователя не отображается без очистки.

---

# 14. CSRF Protection

Dashboard использует защиту от CSRF.

API для Desktop POS использует JWT и CORS.

---

# 15. CORS

Разрешены только доверенные домены.

Поддерживаются:

- Production
- Staging
- Local Development

---

# 16. Rate Limiting

Login:

10 запросов/мин.

API:

120 запросов/мин.

WebSocket:

лимит соединений на устройство.

---

# 17. File Upload Security

Разрешены:

- PNG
- JPG
- WEBP

Максимальный размер:

10 MB.

Проверяются:

- MIME Type;
- расширение;
- размер.

---

# 18. Database Security

PostgreSQL:

- отдельный пользователь;
- минимальные привилегии;
- резервное копирование;
- шифрование соединений.

---

# 19. Offline Storage

SQLite хранит только необходимые данные.

Локальная база шифруется.

После выхода пользователя чувствительные данные очищаются.

---

# 20. Printer Security

Print Service принимает задания только от Backend.

Прямая печать запрещена.

---

# 21. WebSocket Security

Каждое соединение:

- авторизуется;
- привязывается к компании;
- привязывается к филиалу;
- имеет ограниченный набор событий.

---

# 22. Logging

Логируются:

- вход;
- выход;
- изменение прав;
- удаление данных;
- финансовые операции;
- ошибки авторизации.

Пароли и токены не записываются в логи.

---

# 23. Secrets Management

Все секреты хранятся в:

```
.env
```

Запрещено:

- хранить секреты в Git;
- публиковать JWT Secret;
- хранить пароли в исходном коде.

---

# 24. Audit Log

Каждая операция содержит:

- User ID;
- Device ID;
- IP;
- Action;
- Timestamp;
- Entity;
- Result.

---

# 25. Backup Security

Резервные копии:

- шифруются;
- подписываются;
- проверяются на целостность.

---

# 26. Monitoring

Отслеживаются:

- подозрительные входы;
- массовые ошибки авторизации;
- необычная активность;
- отключения принтеров;
- ошибки синхронизации.

---

# 27. Incident Response

При критической угрозе система должна:

1. Записать событие.
2. Уведомить администратора.
3. Ограничить доступ.
4. Сохранить журнал.
5. Продолжить работу остальных модулей.

---

# 28. Security Checklist

Перед релизом проверяются:

- JWT;
- RBAC;
- HTTPS;
- CORS;
- SQL Injection;
- XSS;
- CSRF;
- Brute Force;
- Audit Log;
- Backup.

---

# 29. Acceptance Criteria

Модуль считается готовым если:

✅ Все маршруты защищены.

✅ Все роли работают корректно.

✅ Нет хранения секретов в коде.

✅ Все действия журналируются.

✅ Проходят проверки безопасности.

---

# 30. TODO для Opencode

Реализовать:

- JWT Security
- RBAC Guards
- Password Hashing
- Rate Limiter
- Audit Logger
- Input Validation
- CORS
- HTTPS
- CSRF Protection
- Security Middleware
- Secret Manager
- Session Manager

---

# 31. Future Features

- Two-Factor Authentication (2FA).
- WebAuthn / Passkeys.
- Аппаратные ключи безопасности.
- Шифрование отдельных полей БД.
- SIEM-интеграция.
- Автоматическое обнаружение аномалий.
- Политики безопасности по филиалам.

---

# 32. Следующий этап

## Phase 2 — Детальная разработка модулей

Следующий документ:

`21-pos-ui.md`

Полная спецификация пользовательского интерфейса POS:
- расположение каждого элемента;
- поведение каждой кнопки;
- горячие клавиши;
- адаптация под сенсорные экраны;
- поддержка нескольких мониторов;
- светлая и темная темы;
- требования к производительности и UX.