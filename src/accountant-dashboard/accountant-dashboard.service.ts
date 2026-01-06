import { Injectable } from '@nestjs/common';
import { CreateAccountantDashboardDto } from './dto/create-accountant-dashboard.dto';
import { UpdateAccountantDashboardDto } from './dto/update-accountant-dashboard.dto';

@Injectable()
export class AccountantDashboardService {
  create(createAccountantDashboardDto: CreateAccountantDashboardDto) {
    return 'This action adds a new accountantDashboard';
  }

  findAll() {
    return `This action returns all accountantDashboard`;
  }

  findOne(id: number) {
    return `This action returns a #${id} accountantDashboard`;
  }

  update(id: number, updateAccountantDashboardDto: UpdateAccountantDashboardDto) {
    return `This action updates a #${id} accountantDashboard`;
  }

  remove(id: number) {
    return `This action removes a #${id} accountantDashboard`;
  }
}
