import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { getConfig } from '@openpos/config';
import type { UserRole } from '@openpos/shared';

export interface JwtPayload {
  sub: string;
  username: string;
  role: UserRole;
  companyId: string | null;
  branchId: string | null;
  sessionId: string;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: string;
}

const BCRYPT_ROUNDS = 12;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function generateAccessToken(payload: JwtPayload): string {
  const config = getConfig();
  return jwt.sign(payload, config.jwtSecret, {
    expiresIn: config.jwtExpiration,
    algorithm: 'HS256',
  });
}

export function generateRefreshToken(payload: JwtPayload): string {
  const config = getConfig();
  return jwt.sign(
    { ...payload, type: 'refresh' },
    config.jwtSecret,
    {
      expiresIn: config.jwtRefreshExpiration,
      algorithm: 'HS256',
    },
  );
}

export function generateTokenPair(payload: JwtPayload): TokenPair {
  return {
    accessToken: generateAccessToken(payload),
    refreshToken: generateRefreshToken(payload),
    expiresIn: getConfig().jwtExpiration,
  };
}

export function verifyAccessToken(token: string): JwtPayload {
  const config = getConfig();
  const decoded = jwt.verify(token, config.jwtSecret, {
    algorithms: ['HS256'],
  });
  return decoded as JwtPayload;
}

export function verifyRefreshToken(token: string): JwtPayload {
  const config = getConfig();
  const decoded = jwt.verify(token, config.jwtSecret, {
    algorithms: ['HS256'],
  });
  return decoded as JwtPayload;
}

export function decodeToken(token: string): JwtPayload | null {
  try {
    return jwt.decode(token) as JwtPayload;
  } catch {
    return null;
  }
}

export function isTokenExpired(token: string): boolean {
  const decoded = decodeToken(token);
  if (!decoded || !decoded.exp) return true;
  return Date.now() >= decoded.exp * 1000;
}
