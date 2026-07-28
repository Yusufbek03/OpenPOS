# OpenPOS - Database Design

Version: 1.0

## Purpose

Определить структуру базы данных PostgreSQL для OpenPOS.

## Principles

-   UUID как первичный ключ.
-   UTC для всех дат.
-   Soft Delete.
-   Audit Fields во всех основных таблицах.
-   Нормализация данных.

## Core Tables

### users

-   id (UUID)
-   full_name
-   username
-   password_hash
-   role_id
-   is_active
-   created_at
-   updated_at

### roles

-   id
-   name
-   description

### permissions

-   id
-   code
-   name

### role_permissions

-   role_id
-   permission_id

### categories

-   id
-   name
-   parent_id

### products

-   id
-   category_id
-   sku
-   barcode
-   name
-   price
-   cost
-   tax_rate
-   image_url
-   is_active

### orders

-   id
-   order_number
-   status
-   cashier_id
-   table_id
-   customer_id
-   subtotal
-   discount
-   tax
-   total

### order_items

-   id
-   order_id
-   product_id
-   quantity
-   price
-   total
-   note

### payments

-   id
-   order_id
-   method
-   amount
-   status

### printers

-   id
-   name
-   type
-   ip_address
-   department

### kitchen_tickets

-   id
-   order_id
-   printer_id
-   status

### customers

-   id
-   full_name
-   phone
-   bonus_balance

### inventory

-   id
-   product_id
-   quantity

### stock_movements

-   id
-   product_id
-   type
-   quantity
-   created_at

## Audit Fields

Все основные таблицы содержат:

-   created_at
-   updated_at
-   deleted_at
-   created_by
-   updated_by

## Indexes

Создать индексы для:

-   barcode
-   sku
-   order_number
-   phone
-   created_at

## Relations

-   Role -\> Users
-   Category -\> Products
-   Order -\> OrderItems
-   Order -\> Payments
-   Product -\> Inventory
-   Product -\> StockMovements

## Future

-   Branches
-   Companies
-   Loyalty
-   Delivery
-   Reservations

## Definition of Done

-   Все таблицы определены.
-   Все связи описаны.
-   Все PK = UUID.
-   Все FK определены.
-   Подготовлено для Prisma.

## Next

08-authentication.md
