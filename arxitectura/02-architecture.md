# OpenPOS - System Architecture

Version: 1.0

Status: Approved

## 1. Purpose

Данный документ описывает архитектуру всей системы OpenPOS.

Архитектура должна обеспечивать:

-   Высокую производительность
-   Масштабируемость
-   Простоту поддержки
-   Offline First
-   Real-time обновления
-   Независимость модулей

## 2. High Level Architecture

``` mermaid
graph TD
A[POS Terminal]
B[Kitchen Display]
C[Customer Display]
D[Admin Dashboard]
E[Mobile Owner App]
F[Warehouse]
G[CRM]

A --> API
B --> API
C --> API
D --> API
E --> API
F --> API
G --> API

API --> PostgreSQL
API --> Redis
API --> File Storage
API --> WebSocket Server
API --> Printer Service
```

## 3. Main Components

### Backend API

-   Авторизация
-   Пользователи
-   Заказы
-   Продажи
-   Склад
-   CRM
-   Настройки
-   Отчеты

### PostgreSQL

Главная база данных.

### Redis

Cache, очереди, сессии.

### WebSocket Server

Передача событий в реальном времени.

### Printer Service

Получает задания и направляет их на нужный принтер.

### File Storage

Изображения, логотипы, резервные копии.

## 4. Applications

-   POS
-   Kitchen Display
-   Customer Display
-   Dashboard
-   Warehouse
-   CRM

## 5. Event Flow

``` text
POS
 ↓
Backend
 ↓
Database
 ↓
WebSocket
 ↓
Kitchen
 ↓
Printer
 ↓
Dashboard
 ↓
Owner Mobile
```

## 6. Offline Mode

Продажи продолжаются без интернета. После восстановления связи
происходит автоматическая синхронизация.

## 7. Security

-   JWT
-   RBAC
-   HTTPS
-   Password Hashing
-   Refresh Token
-   Audit Logs

## 8. Performance

-   Продажа \< 300 ms
-   Поиск товаров \< 150 ms
-   Запуск POS \< 3 сек

## 9. Definition of Done

-   Все приложения работают через API
-   Используется WebSocket
-   PostgreSQL --- единственный источник данных
-   Печать через Printer Service
-   Поддерживается Offline Mode

## 10. Next

`03-tech-stack.md`
