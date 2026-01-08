import { Controller, Get, Param, Patch, Query } from '@nestjs/common';
import { AccountantRequestsService } from './accountant-requests.service';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { ApiOperation, ApiParam, ApiQuery } from '@nestjs/swagger';

@Controller('accountant-requests')
export class AccountantRequestsController {
  constructor(
    private readonly accountantRequestsService: AccountantRequestsService,
  ) {}

  @Get('getAccountantRequests')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Get accountant requests ( ADMIN only )' })
  getAccountantRequests() {
   return this.accountantRequestsService.getAccountantRequests();
  }

  @Get('getAccountantIds')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Get accountant IDs ( ADMIN only )' })
  getAccountantIds() {
    return this.accountantRequestsService.getAccountantIds();
  }

  @Patch('approve/:id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Approve accountant request ( ADMIN only )' })
  @ApiQuery({ name: 'accountantId', required: true })
  @ApiParam({ name: 'id', required: true })
  approveAccountantRequest(
    @Query('accountantId') accountantId: string,
    @Param('id') id: string,
  ) {
    return this.accountantRequestsService.approveAccountantRequest(
      accountantId,
      id,
    );
  }

  @Patch('reject/:id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Reject accountant request ( ADMIN only )' })
  @ApiParam({ name: 'id', required: true })
  rejectAccountantRequest(@Param('id') id: string) {
    return this.accountantRequestsService.rejectAccountantRequest(id);
  }
}
