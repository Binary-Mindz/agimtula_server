import { SetMetadata } from '@nestjs/common';

export const MODULE_ACCESS_KEY = 'module_access';

/**
 * Decorator to check if user has access to a specific module
 * Usage: @HasModuleAccess('QUOTATION')
 * 
 * This checks:
 * - Admin role: always granted
 * - User-specific module access (highest priority)
 * - Role-based module access
 */
export const HasModuleAccess = (moduleName: string) =>
  SetMetadata(MODULE_ACCESS_KEY, moduleName);
