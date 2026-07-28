import { describe, it, expect, beforeEach } from 'vitest';

describe('Tables module', () => {
  describe('Table status colors', () => {
    const TABLE_STATUS_COLORS: Record<string, { bg: string; fg: string; label: string }> = {
      FREE: { bg: '#DCFCE7', fg: '#16A34A', label: 'Свободен' },
      OCCUPIED: { bg: '#FEE2E2', fg: '#DC2626', label: 'Занят' },
      RESERVED: { bg: '#DBEAFE', fg: '#2563EB', label: 'Забронирован' },
      CLEANING: { bg: '#FEF9C3', fg: '#A16207', label: 'Уборка' },
    };

    it('should have all required statuses', () => {
      expect(TABLE_STATUS_COLORS).toHaveProperty('FREE');
      expect(TABLE_STATUS_COLORS).toHaveProperty('OCCUPIED');
      expect(TABLE_STATUS_COLORS).toHaveProperty('RESERVED');
      expect(TABLE_STATUS_COLORS).toHaveProperty('CLEANING');
    });

    it('should have valid hex colors', () => {
      for (const [, colors] of Object.entries(TABLE_STATUS_COLORS)) {
        expect(colors.bg).toMatch(/^#[0-9A-Fa-f]{6}$/);
        expect(colors.fg).toMatch(/^#[0-9A-Fa-f]{6}$/);
      }
    });

    it('should have Russian labels', () => {
      expect(TABLE_STATUS_COLORS.FREE.label).toBe('Свободен');
      expect(TABLE_STATUS_COLORS.OCCUPIED.label).toBe('Занят');
    });
  });

  describe('Table number uniqueness', () => {
    it('should detect duplicate table numbers', () => {
      const tables = [
        { number: 1, name: 'Table 1' },
        { number: 2, name: 'Table 2' },
        { number: 1, name: 'Table 1b' },
      ];
      const numbers = tables.map(t => t.number);
      const duplicates = numbers.filter((n, i) => numbers.indexOf(n) !== i);
      expect(duplicates).toEqual([1]);
    });

    it('should have sequential numbers', () => {
      const tables = [
        { number: 1, name: 'Table 1' },
        { number: 2, name: 'Table 2' },
        { number: 3, name: 'Table 3' },
      ];
      const numbers = tables.map(t => t.number).sort((a, b) => a - b);
      expect(numbers).toEqual([1, 2, 3]);
    });
  });
});
