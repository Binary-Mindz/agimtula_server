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
import { Roles } from 'src/auth/decorators/roles.decorator';
import { ApiOperation, ApiParam, ApiQuery } from '@nestjs/swagger';
import { User } from 'src/auth/decorators/user.decorator';
import { jwtPayload } from 'src/auth/types/jwt-payload';

@Controller('invoices')
export class InvoicesController {
  constructor(private readonly invoicesService: InvoicesService) {}

  @Post()
  @Roles('USER')
  @ApiOperation({ summary: 'Create new invoice ( USER only )' })
  async create(
    @Body() createInvoiceDto: CreateInvoiceDto,
    @User() user: jwtPayload,
  ) {
    return await this.invoicesService.create(createInvoiceDto, user.sub);
  }

  @Post('save-to-draft')
  @Roles('USER')
  @ApiOperation({ summary: 'Save invoice as draft ( USER only )' })
  async saveToDraft(@Body() dto: CreateInvoiceDto, @User() user: jwtPayload) {
    return await this.invoicesService.saveToDraft(dto, user.sub);
  }

  @Roles('USER')
  @Get()
  @ApiQuery({
    name: 'search',
    type: String,
    required: false,
  })
  @ApiOperation({ summary: 'Get all invoices ( USER only )' })
  async findAll(@Query('search') search: string) {
    return await this.invoicesService.findAll(search);
  }

  @Roles('USER')
  @Get('drafts')
  @ApiOperation({ summary: 'Get draft invoices ( USER only )' })
  async getDrafts() {
    return await this.invoicesService.getDrafts();
  }

  @Roles('USER')
  @Delete('drafts/:id')
  @ApiParam({
    name: 'id',
    type: String,
    required: true,
  })
  @ApiOperation({ summary: 'Delete draft invoice ( USER only )' })
  async deleteFromDraft(@Param('id') id: string) {
    return await this.invoicesService.deleteFromDraft(id);
  }

  @Roles('USER')
  @Patch('draft-to-invoice/:id')
  @ApiParam({
    name: 'id',
    type: String,
    required: true,
  })
  @ApiOperation({ summary: 'Convert draft to invoice ( USER only )' })
  async draftToInvoice(@Param('id') id: string) {
    return await this.invoicesService.draftToInvoice(id);
  }

  @Roles('USER')
  @Get(':id')
  @ApiParam({
    name: 'id',
    type: String,
    required: true,
  })
  @ApiOperation({ summary: 'Get single invoice ( USER only )' })
  async findOne(@Param('id') id: string, @User() user: jwtPayload) {
    return await this.invoicesService.findOne(id, user.sub);
  }

  @Roles('USER')
  @Patch(':id')
  @ApiParam({
    name: 'id',
    type: String,
    required: true,
  })
  @ApiOperation({ summary: 'Update invoice ( USER only )' })
  async update(
    @Param('id') id: string,
    @Body() updateInvoiceDto: CreateInvoiceDto,
    @User() user: jwtPayload,
  ) {
    return await this.invoicesService.update(id, updateInvoiceDto, user.sub);
  }

  @Roles('USER')
  @Delete(':id')
  @ApiParam({
    name: 'id',
    type: String,
    required: true,
  })
  @ApiOperation({ summary: 'Delete invoice ( USER only )' })
  async remove(@Param('id') id: string, @User() user: jwtPayload) {
    return await this.invoicesService.delete(id, user.sub);
  }
}
