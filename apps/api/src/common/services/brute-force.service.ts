import { Injectable, UnauthorizedException } from '@nestjs/common';

interface LoginAttempt {
  count: number;
  lockedUntil: number | null;
}

const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 15 * 60 * 1000;

@Injectable()
export class BruteForceService {
  private attempts = new Map<string, LoginAttempt>();

  check(username: string, ip: string): void {
    const key = `${username}:${ip}`;
    const record = this.attempts.get(key);
    if (!record) return;

    if (record.lockedUntil && record.lockedUntil > Date.now()) {
      const remaining = Math.ceil((record.lockedUntil - Date.now()) / 60_000);
      throw new UnauthorizedException(`Аккаунт заблокирован. Попробуйте через ${remaining} мин.`);
    }

    if (record.lockedUntil && record.lockedUntil <= Date.now()) {
      this.attempts.delete(key);
    }
  }

  recordFailure(username: string, ip: string): void {
    const key = `${username}:${ip}`;
    const record = this.attempts.get(key) ?? { count: 0, lockedUntil: null };
    record.count++;

    if (record.count >= MAX_ATTEMPTS) {
      record.lockedUntil = Date.now() + LOCKOUT_MS;
    }

    this.attempts.set(key, record);
  }

  recordSuccess(username: string, ip: string): void {
    const key = `${username}:${ip}`;
    this.attempts.delete(key);
  }

  isLocked(username: string, ip: string): boolean {
    const key = `${username}:${ip}`;
    const record = this.attempts.get(key);
    return !!record?.lockedUntil && record.lockedUntil > Date.now();
  }
}
