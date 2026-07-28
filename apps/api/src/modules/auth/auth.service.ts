import { Injectable, UnauthorizedException, BadRequestException, ConflictException } from '@nestjs/common';
import { prisma } from '@openpos/database';
import { getConfig } from '@openpos/config';
import { BruteForceService } from '../../common/services/brute-force.service';
import type { JwtPayload } from './types';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { SupabaseLoginDto } from './dto/supabase-login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';

const BCRYPT_ROUNDS = 12;

async function hashPassword(password: string): Promise<string> {
  const bcrypt = await import('bcryptjs');
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

async function comparePassword(password: string, hash: string): Promise<boolean> {
  const bcrypt = await import('bcryptjs');
  return bcrypt.compare(password, hash);
}

function generateTokenPair(payload: JwtPayload): { accessToken: string; refreshToken: string; expiresIn: string } {
  const jwt = require('jsonwebtoken') as typeof import('jsonwebtoken');
  const config = getConfig();

  const accessToken = jwt.sign(
    { sub: payload.sub, username: payload.username, role: payload.role, companyId: payload.companyId, branchId: payload.branchId, sessionId: payload.sessionId },
    config.jwtSecret,
    { expiresIn: config.jwtExpiration, algorithm: 'HS256' } as Record<string, unknown>,
  );

  const refreshToken = jwt.sign(
    { sub: payload.sub, username: payload.username, role: payload.role, companyId: payload.companyId, branchId: payload.branchId, sessionId: payload.sessionId, type: 'refresh' },
    config.jwtSecret,
    { expiresIn: config.jwtRefreshExpiration, algorithm: 'HS256' } as Record<string, unknown>,
  );

  return { accessToken, refreshToken, expiresIn: config.jwtExpiration };
}

function verifyRefreshToken(token: string): JwtPayload {
  const jwt = require('jsonwebtoken') as typeof import('jsonwebtoken');
  const config = getConfig();
  return jwt.verify(token, config.jwtSecret, { algorithms: ['HS256'] }) as JwtPayload;
}

@Injectable()
export class AuthService {
  private bruteForce = new BruteForceService();

  async register(dto: RegisterDto) {
    if (!dto.email && !dto.phone) {
      throw new BadRequestException('Укажите email или телефон');
    }

    if (dto.email) {
      const exists = await prisma.user.findFirst({ where: { username: dto.email } });
      if (exists) throw new ConflictException('Пользователь с таким email уже существует');
    }

    if (dto.phone) {
      const exists = await prisma.user.findFirst({ where: { username: dto.phone } });
      if (exists) throw new ConflictException('Пользователь с таким телефоном уже существует');
    }

    const cashierRole = await prisma.role.findFirst({ where: { name: 'CASHIER' } });
    if (!cashierRole) throw new BadRequestException('Роль CASHIER не найдена');

    const branch = await prisma.branch.findFirst();
    const username = dto.email || dto.phone!;
    const passwordHash = await hashPassword(dto.password);

    const user = await prisma.user.create({
      data: {
        fullName: dto.fullName,
        username,
        passwordHash,
        roleId: cashierRole.id,
        branchId: branch?.id,
      },
      include: { role: true },
    });

    const session = await prisma.session.create({
      data: { userId: user.id, deviceId: 'web-register', ipAddress: null, lastActivityAt: new Date() },
    });

    const payload: JwtPayload = {
      sub: user.id,
      username: user.username,
      role: user.role.name as JwtPayload['role'],
      companyId: null,
      branchId: user.branchId,
      sessionId: session.id,
    };

    const tokens = generateTokenPair(payload);

    await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });

    return {
      ...tokens,
      user: { id: user.id, fullName: user.fullName, username: user.username, role: user.role.name },
    };
  }

  async supabaseLogin(dto: SupabaseLoginDto) {
    const username = dto.email || dto.phone || dto.supabaseId;

    let user = await prisma.user.findFirst({
      where: { username },
      include: { role: true },
    });

    if (!user) {
      const ownerRole = await prisma.role.findFirst({ where: { name: 'OWNER' } });
      const existingUsers = await prisma.user.count();
      const role = existingUsers === 0 && ownerRole ? ownerRole : await prisma.role.findFirst({ where: { name: 'CASHIER' } });
      if (!role) throw new BadRequestException('Роль не найдена');

      const branch = await prisma.branch.findFirst();

      user = await prisma.user.create({
        data: {
          fullName: dto.fullName,
          username,
          passwordHash: await hashPassword(dto.supabaseId),
          roleId: role.id,
          branchId: branch?.id,
        },
        include: { role: true },
      });
    }

    const session = await prisma.session.create({
      data: { userId: user.id, deviceId: 'supabase-web', ipAddress: null, lastActivityAt: new Date() },
    });

    const payload: JwtPayload = {
      sub: user.id,
      username: user.username,
      role: user.role.name as JwtPayload['role'],
      companyId: null,
      branchId: user.branchId,
      sessionId: session.id,
    };

    const tokens = generateTokenPair(payload);

    await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });

    return {
      ...tokens,
      user: { id: user.id, fullName: user.fullName, username: user.username, role: user.role.name },
    };
  }

  async login(dto: LoginDto, deviceId: string, ipAddress: string | null) {
    const ip = ipAddress ?? 'unknown';
    this.bruteForce.check(dto.username, ip);

    const user = await prisma.user.findUnique({
      where: { username: dto.username },
      include: { role: true },
    });

    if (!user || user.deletedAt) {
      this.bruteForce.recordFailure(dto.username, ip);
      throw new UnauthorizedException('Неверное имя пользователя или пароль');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Аккаунт деактивирован');
    }

    const isPasswordValid = await comparePassword(dto.password, user.passwordHash);
    if (!isPasswordValid) {
      this.bruteForce.recordFailure(dto.username, ip);
      throw new UnauthorizedException('Неверное имя пользователя или пароль');
    }

    this.bruteForce.recordSuccess(dto.username, ip);

    const session = await prisma.session.create({
      data: {
        userId: user.id,
        deviceId,
        ipAddress,
        lastActivityAt: new Date(),
      },
    });

    const payload: JwtPayload = {
      sub: user.id,
      username: user.username,
      role: user.role.name as JwtPayload['role'],
      companyId: null,
      branchId: user.branchId,
      sessionId: session.id,
    };

    const tokens = generateTokenPair(payload);

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    return {
      ...tokens,
      user: {
        id: user.id,
        fullName: user.fullName,
        username: user.username,
        role: user.role.name,
      },
    };
  }

  async refresh(refreshToken: string) {
    let payload: JwtPayload;
    try {
      payload = verifyRefreshToken(refreshToken);
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const storedToken = await prisma.refreshToken.findUnique({
      where: { token: refreshToken },
    });

    if (storedToken?.isRevoked) {
      throw new UnauthorizedException('Refresh token has been revoked');
    }

    const session = await prisma.session.findUnique({
      where: { id: payload.sessionId },
    });

    if (!session?.isActive) {
      throw new UnauthorizedException('Session has expired');
    }

    const newTokens = generateTokenPair(payload);

    if (storedToken) {
      await prisma.refreshToken.update({
        where: { id: storedToken.id },
        data: { isRevoked: true },
      });
    }

    await prisma.refreshToken.create({
      data: {
        userId: payload.sub,
        token: newTokens.refreshToken,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        sessionId: session.id,
      },
    });

    return newTokens;
  }

  async logout(userId: string, sessionId: string): Promise<void> {
    await prisma.session.update({
      where: { id: sessionId },
      data: { isActive: false },
    });

    await prisma.refreshToken.updateMany({
      where: { userId, sessionId },
      data: { isRevoked: true },
    });
  }

  async changePassword(userId: string, dto: ChangePasswordDto): Promise<void> {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException('User not found');

    const isValid = await comparePassword(dto.currentPassword, user.passwordHash);
    if (!isValid) throw new UnauthorizedException('Current password is incorrect');

    const newHash = await hashPassword(dto.newPassword);
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newHash },
    });

    await prisma.session.updateMany({
      where: { userId, isActive: true },
      data: { isActive: false },
    });

    await prisma.refreshToken.updateMany({
      where: { userId },
      data: { isRevoked: true },
    });
  }

  async getMe(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { role: true },
    });

    if (!user) return null;

    return {
      id: user.id,
      fullName: user.fullName,
      username: user.username,
      role: user.role.name,
      branchId: user.branchId,
      hasPinCode: !!user.pinCode,
    };
  }

  async setPinCode(userId: string, pin: string) {
    if (!pin || pin.length < 4 || pin.length > 10) {
      throw new BadRequestException('PIN должен быть от 4 до 10 цифр');
    }
    await prisma.user.update({
      where: { id: userId },
      data: { pinCode: pin },
    });
    return { message: 'PIN установлен' };
  }

  async verifyPinCode(userId: string, pin: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException('Пользователь не найден');
    if (!user.pinCode) throw new BadRequestException('PIN не установлен');
    if (user.pinCode !== pin) throw new UnauthorizedException('Неверный PIN');
    return { message: 'PIN верный', valid: true };
  }

  async getAllUsersForPin() {
    const users = await prisma.user.findMany({
      where: { deletedAt: null, isActive: true },
      select: {
        id: true,
        fullName: true,
        username: true,
        pinCode: true,
        role: { select: { name: true } },
      },
      orderBy: { fullName: 'asc' },
    });
    return users.map((u) => ({
      id: u.id,
      fullName: u.fullName,
      username: u.username,
      role: u.role.name,
      hasPinCode: !!u.pinCode,
    }));
  }
}
