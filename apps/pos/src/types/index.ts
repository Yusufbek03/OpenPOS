export interface AuthUser {
  id: string;
  fullName: string;
  username: string;
  role: string;
  branchId: string | null;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: string;
  user: AuthUser;
}

export interface Product {
  id: string;
  name: string;
  nameRu: string;
  nameEn: string;
  nameUz: string;
  sku: string;
  barcode: string | null;
  price: string;
  cost: string;
  taxRate: string;
  imageUrl: string | null;
  isActive: boolean;
  trackInventory: boolean;
  categoryId: string;
  kitchenStationId: string | null;
  category?: { id: string; name: string; nameRu: string; icon: string | null; color: string | null };
}

export interface Category {
  id: string;
  name: string;
  nameRu: string;
  nameEn: string;
  nameUz: string;
  icon: string | null;
  color: string | null;
  imageUrl: string | null;
  sortOrder: number;
  isActive: boolean;
  _count?: { products: number };
}

export interface CartItem {
  productId: string;
  product: Product;
  quantity: number;
  unitPrice: number;
  discount: number;
  total: number;
  note: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  status: string;
  subtotal: string;
  discount: string;
  tax: string;
  total: string;
  notes: string | null;
  createdAt: string;
  items: OrderItem[];
}

export interface OrderItem {
  id: string;
  quantity: string;
  unitPrice: string;
  discount: string;
  total: string;
  note: string | null;
  status: string;
  product: { id: string; name: string; nameRu: string };
}

export interface Payment {
  id: string;
  orderId: string;
  method: string;
  amount: string;
  status: string;
  createdAt: string;
}

export interface Customer {
  id: string;
  fullName: string;
  phone: string | null;
  bonusBalance: string;
}

export interface PaginatedResponse {
  meta: { page: number; limit: number; total: number; pages: number };
}
