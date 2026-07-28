import { SetMetadata } from '@nestjs/common';
import type { UserRole } from '@openpos/shared';

export const ROLES_KEY = 'roles';
export const RequiredRoles = (...roles: UserRole[]): PropertyDecorator & MethodDecorator =>
  SetMetadata(ROLES_KEY, roles);
