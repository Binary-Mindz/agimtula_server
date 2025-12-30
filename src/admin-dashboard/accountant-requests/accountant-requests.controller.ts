import { Controller, Get, Param, Patch, Query } from '@nestjs/common';
import { AccountantRequestsService } from './accountant-requests.service';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { ApiParam, ApiQuery } from '@nestjs/swagger';

@Controller('accountant-requests')
export class AccountantRequestsController {
  constructor(
    private readonly accountantRequestsService: AccountantRequestsService,
  ) {}

  @Get('getAccountantRequests')
  @Roles('ADMIN')
  getAccountantRequests() {
    this.accountantRequestsService.getAccountantRequests();
  }

  @Get('getAccountantIds')
  @Roles('ADMIN')
  getAccountantIds() {
    return this.accountantRequestsService.getAccountantIds();
  }

  @Patch('approve/:id')
  @Roles('ADMIN')
  @ApiQuery({ name: 'accountantId', required: true })
  @ApiQuery({ name: 'userId', required: true })
  @ApiParam({ name: 'id', required: true })
  approveAccountantRequest(
    @Query() accountantId: string,
    @Query() userId: string,
    @Param('id') id: string,
  ) {
    return this.accountantRequestsService.approveAccountantRequest(
      userId,
      accountantId,
      id,
    );
  }

  @Patch('reject/:id')
  @Roles('ADMIN')
  @ApiParam({ name: 'id', required: true })
  rejectAccountantRequest(@Param('id') id: string) {
    return this.accountantRequestsService.rejectAccountantRequest(id);
  }
}
