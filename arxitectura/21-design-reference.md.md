
# OpenPOS Visual Design Reference

Document: 21-design-reference.md

Project: OpenPOS

Version: 1.0

Status: Approved

---

# Purpose

Данный документ определяет визуальный стиль OpenPOS.

OpenPOS НЕ копирует существующие POS системы.

Вместо этого используются лучшие UX-практики рынка.

---

# Design Goals

Интерфейс должен быть

- минималистичным
- современным
- быстрым
- понятным
- удобным для сенсорных экранов

Главная цель:

кассир должен выполнять любую операцию максимум за 2-3 касания.

---

# Inspiration

При разработке ориентироваться на:

- Poster POS
- Square POS
- Toast POS
- Lightspeed POS
- Shopify POS

Использовать идеи UX.

Не копировать дизайн.

---

# General Style

Стиль:

Modern Flat Design

Минимум визуального шума.

Максимум свободного пространства.

Крупные элементы управления.

---

# Color Palette

Primary

#2563EB

Primary Hover

#1D4ED8

Success

#22C55E

Warning

#F59E0B

Danger

#EF4444

Background

#F8FAFC

Surface

#FFFFFF

Border

#E5E7EB

Text

#111827

Muted

#6B7280

---

# Dark Theme

Background

#0F172A

Surface

#1E293B

Border

#334155

Primary

#3B82F6

Text

#F8FAFC

Muted

#94A3B8

---

# Border Radius

Buttons

12px

Cards

16px

Dialogs

20px

---

# Shadows

Использовать мягкие тени.

Никаких тяжелых теней.

---

# Typography

Font

Inter

Fallback

system-ui

---

# Font Sizes

12

14

16

18

20

24

32

40

---

# Icons

Использовать

Lucide Icons

---

# Spacing

8px Grid System

Все отступы кратны:

8

16

24

32

40

48

---

# Buttons

Primary

Filled

Secondary

Outline

Ghost

Danger

Icon Button

FAB

---

# Animations

Использовать короткие анимации.

100-200 ms.

Никаких долгих эффектов.

---

# Tables

Высота строки

52 px

---

# Inputs

Высота

48 px

---

# Cards

Использовать большие карточки.

Минимальная высота

96 px

---

# Product Card

Фото

Название

Цена

Остаток

Цвет категории

---

# POS Layout

+------------------------------------------------+

Header

+--------+-----------------------+---------------+

Category | Product Grid | Cart

Sidebar | | Panel

+--------+-----------------------+---------------+

Footer

---

# Product Grid

Минимум

4 колонки

Максимум

8 колонок

---

# Cart

Правая колонка.

Ширина

420 px

---

# Header

Высота

72 px

---

# Sidebar

Ширина

100 px

---

# Search

Всегда сверху.

Мгновенный поиск.

---

# Empty States

Использовать иллюстрации.

Показывать понятный текст.

---

# Loading

Использовать Skeleton.

Не использовать Spinner более 300 ms.

---

# Notifications

Использовать Toast.

Положение

Правый верхний угол.

---

# Dialogs

Максимальная ширина

640 px

---

# Responsive

Поддерживать

1280

1440

1920

2560

4K

---

# Touch Screen

Минимальная зона касания

48×48 px

---

# Accessibility

Контраст WCAG AA.

Полная навигация клавиатурой.

Поддержка Screen Reader.

---

# Performance

Любое действие интерфейса

<100 ms

---

# Forbidden

Запрещено:

- Bootstrap стиль
- Material Design по умолчанию
- перегруженные интерфейсы
- маленькие кнопки
- скрытые действия
- длинные формы

---

# Recommended Stack

React 19

Next.js

TailwindCSS v4

shadcn/ui

Lucide

Framer Motion

React Hook Form

TanStack Query

Zustand

---

# Final Goal

OpenPOS должен выглядеть как современный коммерческий продукт уровня 2026 года.

Интерфейс должен создавать ощущение скорости, надежности и простоты.

Каждый экран должен быть интуитивно понятен даже для нового сотрудника.