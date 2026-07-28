import { describe, it, expect, beforeEach } from 'vitest';
import { BruteForceService } from './brute-force.service';

describe('BruteForceService', () => {
  let service: BruteForceService;

  beforeEach(() => {
    service = new BruteForceService();
  });

  it('should allow first login attempt', () => {
    expect(() => service.check('admin', '127.0.0.1')).not.toThrow();
  });

  it('should lock after 5 failed attempts', () => {
    for (let i = 0; i < 5; i++) {
      service.recordFailure('admin', '127.0.0.1');
    }
    expect(() => service.check('admin', '127.0.0.1')).toThrow(/заблокирован/);
  });

  it('should unlock after successful login', () => {
    for (let i = 0; i < 4; i++) {
      service.recordFailure('admin', '127.0.0.1');
    }
    service.recordSuccess('admin', '127.0.0.1');
    expect(() => service.check('admin', '127.0.0.1')).not.toThrow();
  });

  it('should track attempts separately per IP', () => {
    for (let i = 0; i < 5; i++) {
      service.recordFailure('admin', '192.168.1.1');
    }
    expect(() => service.check('admin', '192.168.1.1')).toThrow(/заблокирован/);
    expect(() => service.check('admin', '10.0.0.1')).not.toThrow();
  });

  it('should track attempts separately per username', () => {
    for (let i = 0; i < 5; i++) {
      service.recordFailure('admin', '127.0.0.1');
    }
    expect(() => service.check('admin', '127.0.0.1')).toThrow(/заблокирован/);
    expect(() => service.check('cashier', '127.0.0.1')).not.toThrow();
  });

  it('should report lock status correctly', () => {
    expect(service.isLocked('admin', '127.0.0.1')).toBe(false);
    for (let i = 0; i < 5; i++) {
      service.recordFailure('admin', '127.0.0.1');
    }
    expect(service.isLocked('admin', '127.0.0.1')).toBe(true);
  });
});
