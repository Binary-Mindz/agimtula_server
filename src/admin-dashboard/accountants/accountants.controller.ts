import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { AccountantsService } from './accountants.service';
import { CreateAccountantDto } from './dto/create-accountant.dto';
import { UpdateAccountantDto } from './dto/update-accountant.dto';
import { Roles } from 'src/auth/decorators/roles.decorator';

@Controller('accountants')
export class AccountantsController {
  constructor(private readonly accountantsService: AccountantsService) {}

  @Post()
  @Roles('ADMIN')
  create(@Body() createAccountantDto: CreateAccountantDto) {
    return this.accountantsService.create(createAccountantDto);
  }

  @Get()
  findAll() {
    return this.accountantsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.accountantsService.findOne(+id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateAccountantDto: UpdateAccountantDto,
  ) {
    return this.accountantsService.update(+id, updateAccountantDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.accountantsService.remove(+id);
  }
}
