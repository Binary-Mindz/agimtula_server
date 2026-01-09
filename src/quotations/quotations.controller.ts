import { Controller, Get, Post, Body, Patch, Param, Delete, Query, ValidationPipe, UseGuards } from '@nestjs/common';
import { QuotationsService } from './quotations.service';
import { CreateQuotationDto } from './dto/create-quotation.dto';
import { UpdateQuotationDto } from './dto/update-quotation.dto';
import { User } from 'src/auth/decorators/user.decorator';
import { jwtPayload } from 'src/auth/types/jwt-payload';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { QueryQuotationDto } from './dto/QueryQuotationDto';
import { HasModuleAccess } from 'src/auth/decorators/module-access.decorator';
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
  @ApiOperation({ summary: 'Get all quotations ( USER )' })
  async findAll(@Query() query: QueryQuotationDto) {
    return await this.quotationsService.findAll(query);
  }

  @Get(':id')
  @Roles('USER')
  @ApiOperation({ summary: 'Get single quotation ( USER )' })
  async findOne(@Param('id') id: string) {
    return await this.quotationsService.findOne(+id);
  }

  @Patch(':id')
  @Roles('USER')
  @ApiOperation({ summary: 'Update quotation ( USER )' })
  update(@Param('id') id: string, @Body() updateQuotationDto: UpdateQuotationDto) {
    return this.quotationsService.update(+id, updateQuotationDto);
  }

  @Delete(':id')
  @Roles('USER')
  @ApiOperation({ summary: 'Delete quotation ( USER )' })
  remove(@Param('id') id: string) {
    return this.quotationsService.remove(+id);
  }
}
