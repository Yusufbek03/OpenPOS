import { z } from 'zod';

export const uuidSchema = z.string().uuid();

export const emailSchema = z.string().email('Invalid email address');

export const phoneSchema = z
  .string()
  .regex(/^\+?[1-9]\d{6,14}$/, 'Invalid phone number');

export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[a-zA-Z]/, 'Password must contain at least one letter')
  .regex(/[0-9]/, 'Password must contain at least one digit');

export const usernameSchema = z
  .string()
  .min(3, 'Username must be at least 3 characters')
  .max(50, 'Username must be at most 50 characters')
  .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers and underscores');

export const pinCodeSchema = z
  .string()
  .length(4, 'PIN code must be exactly 4 digits')
  .regex(/^\d{4}$/, 'PIN code must contain only digits');

export const positiveNumberSchema = z.number().positive('Must be a positive number');

export const nonNegativeNumberSchema = z.number().nonnegative('Must be a non-negative number');

export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export const sortSchema = z.object({
  sort: z.string().optional(),
  order: z.enum(['asc', 'desc']).default('asc'),
});

export const searchSchema = z.object({
  q: z.string().min(1).max(200),
});

export const dateRangeSchema = z.object({
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
});

export const createProductSchema = z.object({
  categoryId: uuidSchema,
  name: z.string().min(1).max(200),
  nameRu: z.string().min(1).max(200),
  nameEn: z.string().min(1).max(200),
  nameUz: z.string().min(1).max(200),
  sku: z.string().min(1).max(50),
  barcode: z.string().max(20).optional().nullable(),
  description: z.string().max(1000).optional().nullable(),
  price: positiveNumberSchema,
  cost: nonNegativeNumberSchema,
  taxRate: nonNegativeNumberSchema.max(100),
  imageUrl: z.string().url().optional().nullable(),
  isActive: z.boolean().default(true),
  trackInventory: z.boolean().default(true),
  kitchenStationId: uuidSchema.optional().nullable(),
});

export const createOrderSchema = z.object({
  cashierId: uuidSchema,
  waiterId: uuidSchema.optional().nullable(),
  tableId: uuidSchema.optional().nullable(),
  customerId: uuidSchema.optional().nullable(),
  items: z
    .array(
      z.object({
        productId: uuidSchema,
        quantity: positiveNumberSchema,
        unitPrice: nonNegativeNumberSchema,
        discount: nonNegativeNumberSchema.default(0),
        note: z.string().max(500).optional().nullable(),
      }),
    )
    .min(1, 'Order must have at least one item'),
  notes: z.string().max(1000).optional().nullable(),
});

export const createPaymentSchema = z.object({
  orderId: uuidSchema,
  method: z.enum(['CASH', 'CARD', 'CLICK', 'PAYME', 'UZUM_BANK', 'MIXED']),
  amount: positiveNumberSchema,
});

export const createCustomerSchema = z.object({
  fullName: z.string().min(1).max(200),
  phone: phoneSchema.optional().nullable(),
  email: emailSchema.optional().nullable(),
  birthDate: z.coerce.date().optional().nullable(),
  notes: z.string().max(1000).optional().nullable(),
});

export const loginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: passwordSchema,
});
