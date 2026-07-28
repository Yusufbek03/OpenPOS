import { Controller, Post, Get, Body, HttpCode, HttpStatus, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import type { Request } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { SupabaseLoginDto } from './dto/supabase-login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import type { JwtPayload } from './types';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register new account via email or phone' })
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('supabase-login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login/register via Supabase (Gmail, phone, etc.)' })
  async supabaseLogin(@Body() dto: SupabaseLoginDto) {
    return this.authService.supabaseLogin(dto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login with username and password' })
  async login(
    @Body() dto: LoginDto,
    @Req() req: Request,
  ) {
    const deviceId = (req.headers['x-device-id'] as string) ?? 'unknown';
    const ipAddress = req.ip ?? req.socket.remoteAddress ?? null;
    return this.authService.login(dto, deviceId, ipAddress);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token' })
  async refresh(@Body() dto: RefreshTokenDto) {
    return this.authService.refresh(dto.refreshToken);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Logout current session' })
  async logout(@CurrentUser() user: JwtPayload) {
    await this.authService.logout(user.sub, user.sessionId);
    return { message: 'Logged out successfully' };
  }

  @Post('change-password')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Change password' })
  async changePassword(
    @CurrentUser() user: JwtPayload,
    @Body() dto: ChangePasswordDto,
  ) {
    await this.authService.changePassword(user.sub, dto);
    return { message: 'Password changed successfully' };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user profile' })
  async getMe(@CurrentUser() user: JwtPayload) {
    return this.authService.getMe(user.sub);
  }

  @Post('set-pin')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Set PIN code for lock screen' })
  async setPin(@CurrentUser() _user: JwtPayload, @Body() body: { userId: string; pin: string }) {
    return this.authService.setPinCode(body.userId, body.pin);
  }

  @Post('verify-pin')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify PIN code (for lock screen)' })
  async verifyPin(@Body() body: { userId: string; pin: string }) {
    return this.authService.verifyPinCode(body.userId, body.pin);
  }

  @Get('users-for-pin')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all users for PIN management' })
  async getUsersForPin() {
    return this.authService.getAllUsersForPin();
  }
}
