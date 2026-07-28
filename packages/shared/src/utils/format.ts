import { CURRENCIES, LOCALES } from '../constants/index';
import type { Currency, Locale } from '../types/index';

export function formatCurrency(amount: number, currency: Currency = CURRENCIES.UZS): string {
  return new Intl.NumberFormat(getIntlLocale(currency), {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatNumber(value: number, locale: Locale = LOCALES.ru): string {
  return new Intl.NumberFormat(getIntlLocaleString(locale)).format(value);
}

export function formatPercent(value: number, locale: Locale = LOCALES.ru): string {
  return new Intl.NumberFormat(getIntlLocaleString(locale), {
    style: 'percent',
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value / 100);
}

export function formatDate(date: Date, locale: Locale = LOCALES.ru): string {
  return new Intl.DateTimeFormat(getIntlLocaleString(locale), {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

export function formatTime(date: Date, locale: Locale = LOCALES.ru): string {
  return new Intl.DateTimeFormat(getIntlLocaleString(locale), {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(date);
}

export function formatDateTime(date: Date, locale: Locale = LOCALES.ru): string {
  return new Intl.DateTimeFormat(getIntlLocaleString(locale), {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export function getRelativeTime(date: Date, locale: Locale = LOCALES.ru): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  const rtf = new Intl.RelativeTimeFormat(getIntlLocaleString(locale), { numeric: 'auto' });

  if (diffSec < 60) return rtf.format(-diffSec, 'second');
  if (diffMin < 60) return rtf.format(-diffMin, 'minute');
  if (diffHour < 24) return rtf.format(-diffHour, 'hour');
  return rtf.format(-diffDay, 'day');
}

function getIntlLocale(currency: Currency): string {
  switch (currency) {
    case CURRENCIES.UZS:
      return 'uz-UZ';
    case CURRENCIES.USD:
    case CURRENCIES.EUR:
      return 'en-US';
    default:
      return 'ru-RU';
  }
}

function getIntlLocaleString(locale: Locale): string {
  switch (locale) {
    case LOCALES.ru:
      return 'ru-RU';
    case LOCALES.en:
      return 'en-US';
    case LOCALES.uz:
      return 'uz-UZ';
    default:
      return 'ru-RU';
  }
}
