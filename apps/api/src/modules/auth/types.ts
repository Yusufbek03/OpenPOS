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
