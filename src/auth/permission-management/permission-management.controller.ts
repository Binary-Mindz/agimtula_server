import {
  Controller,
  Post,
  Delete,
  Get,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { PermissionService } from './permission.service';
import { Roles } from '../decorators/roles.decorator';
import { User } from '../decorators/user.decorator';
import { jwtPayload } from '../types/jwt-payload';
import { AuthGuard } from '../guard/auth.guard';

@ApiTags('Module Access Management')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Roles('ADMIN')
@Controller('permissions')
export class PermissionManagementController {
  constructor(private readonly permissionService: PermissionService) { }

  // ============ ROLE-BASED PERMISSIONS ============

  @Post('roles/:role/modules/:moduleName/assign')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Assign module permission to a role (ADMIN only)' })
  @ApiResponse({ status: 200, description: 'Permission assigned successfully' })
  async assignRolePermission(
    @Param('role') role: string,
    @Param('moduleName') moduleName: string,
    @User() user: jwtPayload,
  ) {
    return await this.permissionService.assignRolePermission(
      role,
      moduleName,
      user.sub,
    );
  }

  @Delete('roles/:role/modules/:moduleName/revoke')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Revoke module permission from a role (ADMIN only)' })
  @ApiResponse({ status: 200, description: 'Permission revoked successfully' })
  async revokeRolePermission(
    @Param('role') role: string,
    @Param('moduleName') moduleName: string,
  ) {
    return await this.permissionService.revokeRolePermission(role, moduleName);
  }

  @Get('roles/:role/modules')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get all permissions for a specific role (ADMIN only)' })
  @ApiResponse({ status: 200, description: 'Role permissions retrieved successfully' })
  async getRolePermissions(@Param('role') role: string) {
    return await this.permissionService.getRolePermissions(role);
  }

  @Get('roles/all')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get all roles with their permissions (ADMIN only)' })
  @ApiResponse({ status: 200, description: 'All roles with permissions retrieved successfully' })
  async getAllRolesWithPermissions() {
    return await this.permissionService.getAllRolesWithPermissions();
  }
}

