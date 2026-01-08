import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { AccountantsService } from './accountants.service';
import { CreateAccountantDto } from './dto/create-accountant.dto';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { AuthGuard } from 'src/auth/guard/auth.guard';
import { ApiOperation } from '@nestjs/swagger';

@Controller('accountants')
export class AccountantsController {
  constructor(private readonly accountantsService: AccountantsService) { }

  @Post()
  @UseGuards(AuthGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Create accountant ( ADMIN only )' })
  async create(@Body() createAccountantDto: CreateAccountantDto) {
    return await this.accountantsService.create(createAccountantDto);
  }

  @Get()
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Get all accountants ( ADMIN only )' })
  async findAll() {
    return await this.accountantsService.findAll();
  }

  // @Get(':id')
  // @ApiOperation({ summary: 'Get single accountant' })
  // findOne(@Param('id') id: string) {
  //   return this.accountantsService.findOne(+id);
  // }

  // @Patch(':id')
  // @ApiOperation({ summary: 'Update accountant' })
  // update(
  //   @Param('id') id: string,
  //   @Body() updateAccountantDto: UpdateAccountantDto,
  // ) {
  //   return this.accountantsService.update(+id, updateAccountantDto);
  // }

  // @Delete(':id')
  // @ApiOperation({ summary: 'Delete accountant' })
  // remove(@Param('id') id: string) {
  //   return this.accountantsService.remove(+id);
  // }
}
