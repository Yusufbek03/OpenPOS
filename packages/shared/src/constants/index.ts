export const USER_ROLES = {
  OWNER: 'OWNER',
  ADMINISTRATOR: 'ADMINISTRATOR',
  CASHIER: 'CASHIER',
  WAITER: 'WAITER',
  COOK: 'COOK',
  WAREHOUSE_MANAGER: 'WAREHOUSE_MANAGER',
  ACCOUNTANT: 'ACCOUNTANT',
} as const;

export const ORDER_STATUSES = {
  DRAFT: 'DRAFT',
  PENDING: 'PENDING',
  SENT_TO_KITCHEN: 'SENT_TO_KITCHEN',
  PREPARING: 'PREPARING',
  READY: 'READY',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
  RETURNED: 'RETURNED',
} as const;

export const PAYMENT_METHODS = {
  CASH: 'CASH',
  CARD: 'CARD',
  CLICK: 'CLICK',
  PAYME: 'PAYME',
  UZUM_BANK: 'UZUM_BANK',
  MIXED: 'MIXED',
} as const;

export const PAYMENT_STATUSES = {
  PENDING: 'PENDING',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED',
  REFUNDED: 'REFUNDED',
} as const;

export const KITCHEN_TICKET_STATUSES = {
  NEW: 'NEW',
  ACCEPTED: 'ACCEPTED',
  PREPARING: 'PREPARING',
  READY: 'READY',
  SERVED: 'SERVED',
  CANCELLED: 'CANCELLED',
} as const;

export const PRINT_JOB_STATUSES = {
  PENDING: 'PENDING',
  PRINTING: 'PRINTING',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED',
  CANCELLED: 'CANCELLED',
} as const;

export const PRINT_JOB_TYPES = {
  RECEIPT: 'RECEIPT',
  KITCHEN_TICKET: 'KITCHEN_TICKET',
  BAR_TICKET: 'BAR_TICKET',
  DESSERT_TICKET: 'DESSERT_TICKET',
  RETURN: 'RETURN',
  X_REPORT: 'X_REPORT',
  Z_REPORT: 'Z_REPORT',
} as const;

export const SYNC_STATUSES = {
  PENDING: 'PENDING',
  SYNCING: 'SYNCING',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED',
  CONFLICT: 'CONFLICT',
} as const;

export const CUSTOMER_STATUSES = {
  NEW: 'NEW',
  REGULAR: 'REGULAR',
  VIP: 'VIP',
  BLOCKED: 'BLOCKED',
} as const;

export const STOCK_MOVEMENT_TYPES = {
  SALE: 'SALE',
  RETURN: 'RETURN',
  RECEIPT: 'RECEIPT',
  WRITE_OFF: 'WRITE_OFF',
  TRANSFER: 'TRANSFER',
  INVENTORY: 'INVENTORY',
  ADJUSTMENT: 'ADJUSTMENT',
} as const;

export const WRITE_OFF_REASONS = {
  DAMAGED: 'DAMAGED',
  EXPIRED: 'EXPIRED',
  LOST: 'LOST',
  INTERNAL_USE: 'INTERNAL_USE',
  PRODUCTION: 'PRODUCTION',
} as const;

export const CURRENCIES = {
  UZS: 'UZS',
  USD: 'USD',
  EUR: 'EUR',
} as const;

export const LOCALES = {
  ru: 'ru',
  en: 'en',
  uz: 'uz',
} as const;

export const PERMISSIONS = {
  PRODUCT_READ: 'product.read',
  PRODUCT_CREATE: 'product.create',
  PRODUCT_UPDATE: 'product.update',
  PRODUCT_DELETE: 'product.delete',
  ORDER_READ: 'order.read',
  ORDER_CREATE: 'order.create',
  ORDER_UPDATE: 'order.update',
  ORDER_CANCEL: 'order.cancel',
  INVENTORY_READ: 'inventory.read',
  INVENTORY_WRITE: 'inventory.write',
  CRM_READ: 'crm.read',
  CRM_UPDATE: 'crm.update',
  DASHBOARD_READ: 'dashboard.read',
  REPORT_EXPORT: 'report.export',
  PRINTER_MANAGE: 'printer.manage',
  USER_MANAGE: 'user.manage',
  SETTINGS_MANAGE: 'settings.manage',
} as const;

export const KITCHEN_STATIONS = {
  KITCHEN: 'Kitchen',
  BAR: 'Bar',
  DESSERT: 'Dessert',
  BAKERY: 'Bakery',
  GRILL: 'Grill',
} as const;

export const API_VERSION = 'v1';

export const API_PREFIX = `/api/${API_VERSION}`;

export const PAGINATION_DEFAULTS = {
  PAGE: 1,
  LIMIT: 20,
  MAX_LIMIT: 100,
} as const;

export const RATE_LIMITS = {
  LOGIN: { windowMs: 60_000, max: 10 },
  API: { windowMs: 60_000, max: 120 },
} as const;

export const JWT_CONFIG = {
  ACCESS_TOKEN_EXPIRY: '15m',
  REFRESH_TOKEN_EXPIRY: '30d',
  ALGORITHM: 'HS256',
} as const;

export const DEVICE_PREFIXES = {
  POS: 'POS',
  KITCHEN: 'KITCHEN',
  DASHBOARD: 'DASHBOARD',
  MOBILE: 'MOBILE',
} as const;

export const WEBSOCKET_EVENTS = {
  ORDER_CREATED: 'order.created',
  ORDER_UPDATED: 'order.updated',
  ORDER_CANCELLED: 'order.cancelled',
  ORDER_READY: 'order.ready',
  ORDER_COMPLETED: 'order.completed',
  PAYMENT_COMPLETED: 'payment.completed',
  INVENTORY_UPDATED: 'inventory.updated',
  INVENTORY_LOW_STOCK: 'inventory.low_stock',
  PRINTER_ONLINE: 'printer.online',
  PRINTER_OFFLINE: 'printer.offline',
  PRINTER_COMPLETED: 'printer.completed',
  PRINTER_FAILED: 'printer.failed',
  PRINTER_PAPER_OUT: 'printer.paper_out',
  CUSTOMER_CREATED: 'customer.created',
  CUSTOMER_UPDATED: 'customer.updated',
  BONUS_UPDATED: 'bonus.updated',
  NOTIFICATION_CREATED: 'notification.created',
  NOTIFICATION_READ: 'notification.read',
  KITCHEN_NEW: 'kitchen.new',
  KITCHEN_ACCEPTED: 'kitchen.accepted',
  KITCHEN_PREPARING: 'kitchen.preparing',
  KITCHEN_READY: 'kitchen.ready',
  DASHBOARD_SALES: 'dashboard.sales',
  DASHBOARD_ORDERS: 'dashboard.orders',
  DASHBOARD_INVENTORY: 'dashboard.inventory',
  DASHBOARD_NOTIFICATIONS: 'dashboard.notifications',
} as const;

export const WEBSOCKET_ROOMS = {
  COMPANY: (id: string) => `company:${id}`,
  BRANCH: (id: string) => `branch:${id}`,
  CASHIER: (id: string) => `cashier:${id}`,
  KITCHEN: 'kitchen',
  PRINTER: 'printer',
  DASHBOARD: 'dashboard',
  OWNER: 'owner',
} as const;
