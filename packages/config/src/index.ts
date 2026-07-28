import type { Locale, Currency } from '@openpos/shared';

export interface AppConfig {
  nodeEnv: 'development' | 'production' | 'test';
  port: number;
  apiUrl: string;
  databaseUrl: string;
  redisUrl: string;
  jwtSecret: string;
  jwtExpiration: string;
  jwtRefreshExpiration: string;
  adminUrl: string;
  posUrl: string;
  kitchenUrl: string;
  customerDisplayUrl: string;
  wsPort: number;
  wsCorsOrigin: string;
  defaultPrinterIp: string;
  defaultPrinterPort: number;
  uploadDir: string;
  maxFileSize: number;
  rateLimitWindowMs: number;
  rateLimitMaxRequests: number;
  loginRateLimitMax: number;
  logLevel: string;
  defaultCurrency: Currency;
  defaultLocale: Locale;
}

function getEnv(key: string, defaultValue?: string): string {
  const value = process.env[key];
  if (value === undefined) {
    if (defaultValue !== undefined) return defaultValue;
    throw new Error(`Environment variable ${key} is not set`);
  }
  return value;
}

function getEnvInt(key: string, defaultValue?: number): number {
  const value = process.env[key];
  if (value === undefined) {
    if (defaultValue !== undefined) return defaultValue;
    throw new Error(`Environment variable ${key} is not set`);
  }
  const parsed = parseInt(value, 10);
  if (isNaN(parsed)) {
    throw new Error(`Environment variable ${key} is not a valid integer`);
  }
  return parsed;
}

let cachedConfig: AppConfig | null = null;

export function getConfig(): AppConfig {
  if (cachedConfig) return cachedConfig;

  cachedConfig = {
    nodeEnv: getEnv('NODE_ENV', 'development') as AppConfig['nodeEnv'],
    port: getEnvInt('PORT', 3000),
    apiUrl: getEnv('API_URL', 'http://localhost:3000'),
    databaseUrl: getEnv(
      'DATABASE_URL',
      'postgresql://openpos:openpos_secret@localhost:5432/openpos?schema=public',
    ),
    redisUrl: getEnv('REDIS_URL', 'redis://localhost:6379'),
    jwtSecret: getEnv('JWT_SECRET', 'dev-jwt-secret-change-in-production'),
    jwtExpiration: getEnv('JWT_EXPIRATION', '15m'),
    jwtRefreshExpiration: getEnv('JWT_REFRESH_EXPIRATION', '30d'),
    adminUrl: getEnv('ADMIN_URL', 'http://localhost:5173'),
    posUrl: getEnv('POS_URL', 'http://localhost:5174'),
    kitchenUrl: getEnv('KITCHEN_URL', 'http://localhost:5175'),
    customerDisplayUrl: getEnv('CUSTOMER_DISPLAY_URL', 'http://localhost:5176'),
    wsPort: getEnvInt('WS_PORT', 3001),
    wsCorsOrigin: getEnv('WS_CORS_ORIGIN', 'http://localhost:5173'),
    defaultPrinterIp: getEnv('DEFAULT_PRINTER_IP', 'localhost'),
    defaultPrinterPort: getEnvInt('DEFAULT_PRINTER_PORT', 9100),
    uploadDir: getEnv('UPLOAD_DIR', './uploads'),
    maxFileSize: getEnvInt('MAX_FILE_SIZE', 10485760),
    rateLimitWindowMs: getEnvInt('RATE_LIMIT_WINDOW_MS', 60000),
    rateLimitMaxRequests: getEnvInt('RATE_LIMIT_MAX_REQUESTS', 120),
    loginRateLimitMax: getEnvInt('LOGIN_RATE_LIMIT_MAX', 10),
    logLevel: getEnv('LOG_LEVEL', 'debug'),
    defaultCurrency: getEnv('DEFAULT_CURRENCY', 'UZS') as Currency,
    defaultLocale: getEnv('DEFAULT_LOCALE', 'ru') as Locale,
  };

  return cachedConfig;
}

export function resetConfig(): void {
  cachedConfig = null;
}
