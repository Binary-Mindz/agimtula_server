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
import { ApiParam, ApiQuery } from '@nestjs/swagger';
import { User } from 'src/auth/decorators/user.decorator';
import { jwtPayload } from 'src/auth/types/jwt-payload';

@Controller('invoices')
export class InvoicesController {
  constructor(private readonly invoicesService: InvoicesService) {}

  @Post()
  @Roles('USER')
  async create(
    @Body() createInvoiceDto: CreateInvoiceDto,
    @User() user: jwtPayload,
  ) {
    return await this.invoicesService.create(createInvoiceDto, user.sub);
  }

  @Post('save-to-draft')
  @Roles('USER')
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
  async findAll(@Query('search') search: string) {
    return await this.invoicesService.findAll(search);
  }

  @Roles('USER')
  @Get('drafts')
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
  async draftToInvoice(@Param('id') id: string) {
    return await this.invoicesService.draftToInvoice(id);
  }

  @Roles('USER')
  @Delete(':id')
  @ApiParam({
    name: 'id',
    type: String,
    required: true,
  })
  remove(@Param('id') id: string) {
    return this.invoicesService.remove(id);
  }
}
