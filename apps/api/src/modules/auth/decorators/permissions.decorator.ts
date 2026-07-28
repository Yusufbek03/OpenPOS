import { SetMetadata } from '@nestjs/common';

export const PERMISSIONS_KEY = 'permissions';
export const RequiredPermissions = (...permissions: string[]): PropertyDecorator & MethodDecorator =>
  SetMetadata(PERMISSIONS_KEY, permissions);
