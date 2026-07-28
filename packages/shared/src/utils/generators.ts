export function generateOrderNumber(prefix = 'ORD'): string {
  const now = new Date();
  const date = now.toISOString().slice(0, 10).replace(/-/g, '');
  const time = now.toTimeString().slice(0, 8).replace(/:/g, '');
  const random = Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, '0');
  return `${prefix}-${date}-${time}-${random}`;
}

export function generateSKU(categoryPrefix: string, index: number): string {
  return `${categoryPrefix.toUpperCase()}-${index.toString().padStart(5, '0')}`;
}

export function generateDeviceCode(type: string, number: number): string {
  return `${type.toUpperCase()}-${number.toString().padStart(3, '0')}`;
}

export function generateBarcode(): string {
  const base = Math.floor(Math.random() * 10000000000000)
    .toString()
    .padStart(13, '0');
  return base;
}

export function calculateCheckDigit(code: string): number {
  let sum = 0;
  for (let i = 0; i < code.length; i++) {
    const digit = parseInt(code[i] ?? '0', 10);
    sum += i % 2 === 0 ? digit : digit * 3;
  }
  return (10 - (sum % 10)) % 10;
}

export function parseBarcode(barcode: string): { isValid: boolean; type: string; value: string } {
  const trimmed = barcode.trim();
  if (trimmed.length === 13) {
    return { isValid: true, type: 'EAN13', value: trimmed };
  }
  if (trimmed.length === 12) {
    return { isValid: true, type: 'EAN12', value: trimmed };
  }
  if (trimmed.length === 8) {
    return { isValid: true, type: 'EAN8', value: trimmed };
  }
  return { isValid: false, type: 'UNKNOWN', value: trimmed };
}
