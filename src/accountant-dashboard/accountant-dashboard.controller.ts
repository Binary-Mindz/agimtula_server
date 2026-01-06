import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { AccountantDashboardService } from './accountant-dashboard.service';
import { CreateAccountantDashboardDto } from './dto/create-accountant-dashboard.dto';
import { UpdateAccountantDashboardDto } from './dto/update-accountant-dashboard.dto';

@Controller('accountant-dashboard')
export class AccountantDashboardController {
  constructor(private readonly accountantDashboardService: AccountantDashboardService) {}

  @Post()
  create(@Body() createAccountantDashboardDto: CreateAccountantDashboardDto) {
    return this.accountantDashboardService.create(createAccountantDashboardDto);
  }

  @Get()
  findAll() {
    return this.accountantDashboardService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.accountantDashboardService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateAccountantDashboardDto: UpdateAccountantDashboardDto) {
    return this.accountantDashboardService.update(+id, updateAccountantDashboardDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.accountantDashboardService.remove(+id);
  }
}
