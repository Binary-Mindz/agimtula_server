import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { UserManagementService } from './user-management.service';
import { urlPrefix } from '../url-prefix';
import { ApiBody, ApiOperation, ApiParam, ApiQuery } from '@nestjs/swagger';
import { Roles } from 'src/decorators/roles.decorator';
import { CreateUserManagementDto } from './dto/create-user-management.dto';

@Controller(`${urlPrefix}/user-management`)
export class AdminUserManagementController {
  constructor(private readonly userManagementService: UserManagementService) { }

  @Roles('ADMIN')
  @Get()
  @ApiOperation({
    summary: 'Get all users with search and filtering ( PUBLIC )',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: 'number',
    description: 'Page number (default: 1)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: 'number',
    description: 'Items per page (default: 10)',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    type: 'string',
    description: 'Search by email or name',
  })
  @ApiQuery({
    name: 'planFilter',
    required: false,
    type: 'string',
    description: 'Filter by subscription plan name',
  })
  @ApiQuery({
    name: 'isActive',
    required: false,
    type: 'boolean',
    description: 'Filter by active status (true/false)',
  })
  findAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('search') search?: string,
    @Query('planFilter') planFilter?: string,
    @Query('isActive') isActive?: boolean,
  ) {
    return this.userManagementService.findAllUsers(
      page || 1,
      limit || 10,
      search,
      planFilter,
      isActive,
    );
  }

  @Post()
  @Roles('ADMIN')
  create(@Body() createUserManagementDto: CreateUserManagementDto) {
    return this.userManagementService.createUser(createUserManagementDto);
  }

  @Patch('updateStatus/:userId')
  @Roles('ADMIN')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        status: {
          type: 'boolean',
          example: true,
        },
      },
    },
  })
  @ApiParam({
    name: 'userId',
    type: String,
  })
  updateStatus(@Param('userId') userId: string, @Body() body: { status: boolean }) {
    return this.userManagementService.updateStatus(userId, body.status);
  }

  @Patch('updateRole/:id')
  @Roles('ADMIN')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        role: {
          type: 'string',
          example: 'USER',
        },
      },
    },
  })
  @ApiParam({
    name: 'id',
    type: String,
    required:true
  })
  updateRole(@Param('id') id: string, @Body() body: { role: 'USER' | 'ACCOUNTANT' }) {
    return this.userManagementService.updateRole(id, body.role);
  }

  @Get('get-plans')
  @Roles('ADMIN')
  getPlans() {
    return this.userManagementService.getPlans();
  }

  @Delete('deleteAccount/:userId')
  @Roles('ADMIN')
    @ApiParam({
    name: 'userId',
    type: String,
    required:true
  })
 async deleteAccount(@Param('userId') userId:string) {
    return await this.userManagementService.deleteAccount(userId);
  }

    @Get("user-data/:userId")
  @Roles("ADMIN")
    @ApiParam({
    name: "userId",
    type: String,
    required:true
    })
    
  async getUserData(@Param('userId')userId:string){
    return await this.userManagementService.getUserData(userId)
  }
    
}
