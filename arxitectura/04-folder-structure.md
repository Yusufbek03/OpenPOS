# OpenPOS - Folder Structure

Version: 1.0

## Цель

Определить единую структуру репозитория.

## Структура

``` text
openpos/
├── apps/
│   ├── api/
│   ├── admin/
│   ├── pos/
│   ├── kitchen/
│   ├── customer-display/
│   └── owner-mobile/
├── packages/
│   ├── database/
│   ├── auth/
│   ├── ui/
│   ├── printer/
│   ├── websocket/
│   ├── shared/
│   └── config/
├── docs/
├── prompts/
├── specs/
├── decisions/
├── docker/
├── scripts/
├── .github/
├── package.json
├── pnpm-workspace.yaml
└── README.md
```

## Назначение папок

### apps

Готовые приложения.

### packages

Общие библиотеки, используемые всеми приложениями.

### docs

Архитектурная документация.

### prompts

Промпты для Opencode.

### specs

Подробные технические спецификации.

### decisions

Архитектурные решения (ADR).

### docker

Docker и Docker Compose.

### scripts

Служебные скрипты.

## Правила

-   Новые приложения создаются только в `apps/`.
-   Общий код запрещено дублировать --- он выносится в `packages/`.
-   Документация обновляется вместе с кодом.
-   Каждый модуль имеет README.md.

## Next

05-coding-rules.md
