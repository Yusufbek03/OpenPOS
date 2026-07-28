# OpenPOS - Coding Rules

Version: 1.0

## Purpose

Этот документ определяет единые правила разработки проекта OpenPOS.

## Основные принципы

-   Чистый код.
-   SOLID.
-   DRY.
-   KISS.
-   YAGNI.
-   Composition over Inheritance.

## Язык

-   TypeScript для всего нового кода.
-   Strict Mode обязательно.

## Именование

### Файлы

-   kebab-case
-   product.service.ts
-   create-order.dto.ts

### Папки

-   kebab-case

### Классы

-   PascalCase

### Интерфейсы

-   Начинаются с I запрещено.
-   Использовать осмысленные имена.

### Переменные

-   camelCase

### Константы

-   UPPER_SNAKE_CASE

## Архитектура

-   Controller отвечает только за HTTP.
-   Service содержит бизнес-логику.
-   Repository работает с БД.
-   DTO используются для входных данных.
-   Entity описывает модель.

## Запрещено

-   SQL в контроллерах.
-   Бизнес-логика в React компонентах.
-   any без причины.
-   Дублирование кода.
-   Магические числа.

## Git

Ветки:

-   main
-   develop
-   feature/\*
-   fix/\*
-   hotfix/\*

Коммиты:

-   feat:
-   fix:
-   refactor:
-   docs:
-   chore:
-   test:

## Code Review

Проверяется:

-   читаемость
-   безопасность
-   производительность
-   тестируемость

## Testing

-   Unit Tests
-   Integration Tests

## Documentation

Каждый публичный модуль должен иметь README.md.

Все API документируются.

## Definition of Done

-   Код проходит ESLint.
-   Код форматирован Prettier.
-   Нет ошибок TypeScript.
-   Документация обновлена.
-   Код протестирован.

## Next

06-design-system.md
