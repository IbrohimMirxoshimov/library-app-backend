import { SetMetadata } from '@nestjs/common';

export const PERMISSIONS_KEY = 'permissions';

/**
 * Marks an endpoint as requiring specific permissions.
 * Used with PermissionsGuard to check role permissions.
 * Usage: @RequirePermissions(PERMISSIONS.CREATE_BOOKS, PERMISSIONS.UPDATE_BOOKS)
 */
export const RequirePermissions = (...permissions: number[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);
