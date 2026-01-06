import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { InvoicesService } from './invoices.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { ApiQuery } from '@nestjs/swagger';

@Controller('invoices')
export class InvoicesController {
  constructor(private readonly invoicesService: InvoicesService) {}

  @Post()
  @Roles('USER')
  async create(@Body() createInvoiceDto: CreateInvoiceDto) {
    return await this.invoicesService.create(createInvoiceDto);
  }

  @Post('save-to-draft')
  @Roles('USER')
  async saveToDraft(@Body() dto: CreateInvoiceDto) {
    return await this.invoicesService.saveToDraft(dto);
  }

  @Roles('USER')
  @Get()
  @ApiQuery({
    name: 'search',
    type: String,
    required: false,
  })
  async findAll(@Query('search') search: string) {
    return await this.invoicesService.findAll(search);
  }

  @Roles('USER')
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.invoicesService.findOne(+id);
  }

  @Roles('USER')
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateInvoiceDto: UpdateInvoiceDto) {
    return this.invoicesService.update(+id, updateInvoiceDto);
  }

  @Roles('USER')
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.invoicesService.remove(+id);
  }
}
