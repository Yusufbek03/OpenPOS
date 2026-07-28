import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import type { JwtPayload } from '../types';

export const CurrentUser = createParamDecorator(
  (data: keyof JwtPayload | undefined, ctx: ExecutionContext): JwtPayload | string | null => {
    const request = ctx.switchToHttp().getRequest<{ user: JwtPayload }>();
    const user = request.user;
    if (!user) return null;
    if (data) return user[data] as string;
    return user;
  },
);
