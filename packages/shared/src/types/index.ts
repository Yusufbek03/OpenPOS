export type UserRole = 'OWNER' | 'ADMINISTRATOR' | 'CASHIER' | 'WAITER' | 'COOK' | 'WAREHOUSE_MANAGER' | 'ACCOUNTANT';

export type OrderStatus =
  | 'DRAFT'
  | 'PENDING'
  | 'SENT_TO_KITCHEN'
  | 'PREPARING'
  | 'READY'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'RETURNED';

export type PaymentMethod = 'CASH' | 'CARD' | 'CLICK' | 'PAYME' | 'UZUM_BANK' | 'MIXED';

export type PaymentStatus = 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';

export type KitchenTicketStatus = 'NEW' | 'ACCEPTED' | 'PREPARING' | 'READY' | 'SERVED' | 'CANCELLED';

export type PrintJobStatus = 'PENDING' | 'PRINTING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';

export type PrintJobType = 'RECEIPT' | 'KITCHEN_TICKET' | 'BAR_TICKET' | 'DESSERT_TICKET' | 'RETURN' | 'X_REPORT' | 'Z_REPORT';

export type SyncStatus = 'PENDING' | 'SYNCING' | 'COMPLETED' | 'FAILED' | 'CONFLICT';

export type CustomerStatus = 'NEW' | 'REGULAR' | 'VIP' | 'BLOCKED';

export type StockMovementType = 'SALE' | 'RETURN' | 'RECEIPT' | 'WRITE_OFF' | 'TRANSFER' | 'INVENTORY' | 'ADJUSTMENT';

export type TransferStatus = 'DRAFT' | 'IN_TRANSIT' | 'COMPLETED' | 'CANCELLED';

export type WriteOffReason = 'DAMAGED' | 'EXPIRED' | 'LOST' | 'INTERNAL_USE' | 'PRODUCTION';

export type Theme = 'LIGHT' | 'DARK';

export type Locale = 'ru' | 'en' | 'uz';

export type Currency = 'UZS' | 'USD' | 'EUR';

export interface BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  createdBy: string | null;
  updatedBy: string | null;
}

export interface User extends BaseEntity {
  fullName: string;
  username: string;
  passwordHash: string;
  roleId: string;
  pinCode: string | null;
  isActive: boolean;
  lastLoginAt: Date | null;
}

export interface Role extends BaseEntity {
  name: UserRole;
  description: string;
}

export interface Permission extends BaseEntity {
  code: string;
  name: string;
}

export interface RolePermission {
  roleId: string;
  permissionId: string;
}

export interface Category extends BaseEntity {
  name: string;
  nameRu: string;
  nameEn: string;
  nameUz: string;
  parentId: string | null;
  sortOrder: number;
  icon: string | null;
  color: string | null;
  isActive: boolean;
}

export interface Product extends BaseEntity {
  categoryId: string;
  sku: string;
  barcode: string | null;
  name: string;
  nameRu: string;
  nameEn: string;
  nameUz: string;
  description: string | null;
  price: number;
  cost: number;
  taxRate: number;
  imageUrl: string | null;
  isActive: boolean;
  trackInventory: boolean;
  kitchenStationId: string | null;
}

export interface Order extends BaseEntity {
  orderNumber: string;
  status: OrderStatus;
  cashierId: string;
  waiterId: string | null;
  tableId: string | null;
  customerId: string | null;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  notes: string | null;
  branchId: string;
}

export interface OrderItem extends BaseEntity {
  orderId: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  total: number;
  note: string | null;
  status: KitchenTicketStatus;
}

export interface Payment extends BaseEntity {
  orderId: string;
  method: PaymentMethod;
  amount: number;
  status: PaymentStatus;
  transactionId: string | null;
  processedBy: string;
}

export interface Customer extends BaseEntity {
  fullName: string;
  phone: string | null;
  email: string | null;
  birthDate: Date | null;
  status: CustomerStatus;
  bonusBalance: number;
  totalSpent: number;
  totalOrders: number;
  lastVisitAt: Date | null;
  notes: string | null;
}

export interface Printer extends BaseEntity {
  name: string;
  type: string;
  ipAddress: string | null;
  port: number | null;
  department: string;
  paperWidth: number;
  isActive: boolean;
  status: string;
}

export interface KitchenTicket extends BaseEntity {
  orderId: string;
  printerId: string | null;
  stationId: string;
  status: KitchenTicketStatus;
  printedAt: Date | null;
}

export interface KitchenStation extends BaseEntity {
  name: string;
  printerId: string | null;
  sortOrder: number;
  isActive: boolean;
}

export interface Inventory extends BaseEntity {
  productId: string;
  quantity: number;
  minQuantity: number;
  maxQuantity: number | null;
  warehouseId: string | null;
}

export interface StockMovement extends BaseEntity {
  productId: string;
  type: StockMovementType;
  quantity: number;
  referenceId: string | null;
  notes: string | null;
  warehouseId: string | null;
}

export interface Supplier extends BaseEntity {
  name: string;
  inn: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  contactPerson: string | null;
}

export interface AuditLog extends BaseEntity {
  userId: string;
  deviceId: string | null;
  ipAddress: string | null;
  action: string;
  entity: string;
  entityId: string | null;
  oldValues: Record<string, unknown> | null;
  newValues: Record<string, unknown> | null;
  result: 'SUCCESS' | 'FAILURE';
}

export interface Session extends BaseEntity {
  userId: string;
  deviceId: string;
  ipAddress: string | null;
  userAgent: string | null;
  lastActivityAt: Date;
  isActive: boolean;
}

export interface RefreshToken extends BaseEntity {
  userId: string;
  token: string;
  expiresAt: Date;
  sessionId: string;
  isRevoked: boolean;
}

export interface Device extends BaseEntity {
  name: string;
  code: string;
  type: string;
  branchId: string | null;
  lastActiveAt: Date | null;
}

export interface Branch extends BaseEntity {
  name: string;
  address: string | null;
  phone: string | null;
  isActive: boolean;
}

export interface Company extends BaseEntity {
  name: string;
  inn: string | null;
  address: string | null;
  phone: string | null;
  logoUrl: string | null;
  defaultCurrency: Currency;
  defaultLocale: Locale;
}

export interface PrintJob extends BaseEntity {
  printerId: string;
  type: PrintJobType;
  status: PrintJobStatus;
  data: Record<string, unknown>;
  attempts: number;
  maxAttempts: number;
  lastError: string | null;
  printedAt: Date | null;
}

export interface StockTransfer extends BaseEntity {
  fromWarehouseId: string;
  toWarehouseId: string;
  status: TransferStatus;
  notes: string | null;
}

export interface StockTransferItem extends BaseEntity {
  transferId: string;
  productId: string;
  quantity: number;
  receivedQuantity: number | null;
}

export interface InventoryCount extends BaseEntity {
  status: 'DRAFT' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  warehouseId: string | null;
  notes: string | null;
}

export interface InventoryCountItem extends BaseEntity {
  countId: string;
  productId: string;
  systemQuantity: number;
  actualQuantity: number | null;
  difference: number | null;
}

export interface SyncQueueItem {
  id: string;
  entity: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE';
  data: Record<string, unknown>;
  status: SyncStatus;
  attempts: number;
  lastError: string | null;
  createdAt: Date;
  syncedAt: Date | null;
  deviceId: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  message: string;
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface ApiError {
  success: false;
  message: string;
  error: {
    code: string;
    details: Array<{
      field: string;
      message: string;
    }>;
  };
}
