import { Controller, Get, Post, Body, Patch, Param, Delete, Query,  UseGuards } from '@nestjs/common';
import { QuotationsService } from './quotations.service';
import { CreateQuotationDto } from './dto/create-quotation.dto';
import { UpdateQuotationDto } from './dto/update-quotation.dto';
import { User } from 'src/decorators/user.decorator';
import { jwtPayload } from 'src/auth/types/jwt-payload';
import { Roles } from 'src/decorators/roles.decorator';
import { QueryQuotationDto } from './dto/QueryQuotationDto';
import { HasModuleAccess } from 'src/decorators/module-access.decorator';
import { ModuleAccessGuard } from 'src/auth/guard/module-access.guard';
import { AuthGuard } from 'src/auth/guard/auth.guard';
import { ApiOperation } from '@nestjs/swagger';

@Controller('quotations')
@UseGuards(AuthGuard, ModuleAccessGuard)
@HasModuleAccess('QUOTATION')
export class QuotationsController {
  constructor(private readonly quotationsService: QuotationsService) { }

  @Post('create-quotation')
  @Roles('USER')
  @ApiOperation
    ({ summary: 'Create quotation ( USER )' })
  @HasModuleAccess('quotations')
  async create(@Body() createQuotationDto: CreateQuotationDto, @User() user: jwtPayload,) {
    return await this.quotationsService.create(createQuotationDto, user.sub);
  }

  @Get()
  @Roles('USER')
  @HasModuleAccess('quotations')
  @ApiOperation({ summary: 'Get all quotations ( USER )' })
  async findAll(@Query() query: QueryQuotationDto) {
    return await this.quotationsService.findAll(query);
  }

  @Get(':id')
  @HasModuleAccess('quotations')
  @Roles('USER')
  @ApiOperation({ summary: 'Get single quotation ( USER )' })
  async findOne(@Param('id') id: string) {
    return await this.quotationsService.findOne(+id);
  }

  @Patch(':id')
  @HasModuleAccess('quotations')
  @Roles('USER')
  @ApiOperation({ summary: 'Update quotation ( USER )' })
  update(@Param('id') id: string, @Body() updateQuotationDto: UpdateQuotationDto) {
    return this.quotationsService.update(+id, updateQuotationDto);
  }

  @Delete(':id')
  @HasModuleAccess('quotations')
  @Roles('USER')
  @ApiOperation({ summary: 'Delete quotation ( USER )' })
  remove(@Param('id') id: string) {
    return this.quotationsService.remove(+id);
  }
}
