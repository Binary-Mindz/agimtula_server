import {
  Controller,
  Post,
  Delete,
  Get,
  Body,
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
import { GrantUserModuleDto } from './dto/GrandUser.dto';
import { RevokeUserModuleDto } from './dto/revoke-user-module.dto';
import { User } from '../decorators/user.decorator';
import { jwtPayload } from '../types/jwt-payload';
import { AuthGuard } from '../guard/auth.guard';

@ApiTags('Module Access Management')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Roles('ADMIN')
@Controller('permissions/modules')
export class PermissionManagementController {
  constructor(private readonly permissionService: PermissionService) { }


  @Post('user/grant')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Grant module access to a user' })
  @ApiResponse({ status: 200, description: 'Module access granted successfully' })
  async grantUserModuleAccess(
    @Body() body: GrantUserModuleDto,
    @User() user: jwtPayload
  ) {
    return await this.permissionService.grantUserModuleAccess(
      body.userId,
      body.moduleName,
      user.sub,
    );
  }

  @Delete('user/revoke')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Revoke module access from a user' })
  @ApiResponse({ status: 200, description: 'Module access revoked successfully' })
  async revokeUserModuleAccess(@Body() body: RevokeUserModuleDto) {
    return this.permissionService.revokeUserModuleAccess(
      body.userId,
      body.moduleName,
    );
  }

  @Get('user/:userId')
  @ApiOperation({ summary: 'Get all modules accessible by a user' })
  @ApiResponse({ status: 200, description: 'User modules retrieved successfully' })
  async getUserModules(@Param('userId') userId: string) {
    return await this.permissionService.getUserModules(userId);
  }


  @Get()
  @ApiOperation({ summary: 'Get all available modules' })
  @ApiResponse({ status: 200, description: 'All modules retrieved successfully' })
  async getAllModules() {
    return await this.permissionService.getAllModules();
  }

  @Get(':moduleName')
  @ApiOperation({ summary: 'Get module details by name' })
  @ApiResponse({ status: 200, description: 'Module details retrieved successfully' })
  async getModuleByName(@Param('moduleName') moduleName: string) {
    return await this.permissionService.getModuleByName(moduleName);
  }

  @Get(':moduleName/users')
  @ApiOperation({ summary: 'Get users with access to a specific module' })
  @ApiResponse({ status: 200, description: 'Users with module access retrieved successfully' })
  async getUsersWithModuleAccess(@Param('moduleName') moduleName: string) {
    return await this.permissionService.getUsersWithModuleAccess(moduleName);
  }
}
