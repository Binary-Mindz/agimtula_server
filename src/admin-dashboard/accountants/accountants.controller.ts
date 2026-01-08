import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
} from '@nestjs/common';
import { AccountantsService } from './accountants.service';
import { CreateAccountantDto } from './dto/create-accountant.dto';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { AuthGuard } from 'src/auth/guard/auth.guard';

@Controller('accountants')
export class AccountantsController {
  constructor(private readonly accountantsService: AccountantsService) { }

  @Post()
  @UseGuards(AuthGuard)
  @Roles('ADMIN')
  create(@Body() createAccountantDto: CreateAccountantDto) {
    return this.accountantsService.create(createAccountantDto);
  }

  @Get()
  @Roles('ADMIN')
  async findAll() {
    return await this.accountantsService.findAll();
  }

}
