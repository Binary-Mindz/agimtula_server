import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { ReceiptsService } from './receipts.service';
import { UploadReceiptDto } from './dto/upload-receipt.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBody, ApiConsumes, ApiQuery } from '@nestjs/swagger';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { User } from 'src/auth/decorators/user.decorator';
import { jwtPayload } from 'src/auth/types/jwt-payload';

@Controller('receipts')
export class ReceiptsController {
  constructor(private readonly receiptsService: ReceiptsService) {}

  // Receipt Category

  @Post('create-category')
  @Roles('USER')
  @UsePipes(new ValidationPipe({ transform: true }))
  @ApiBody({ schema: { properties: { name: { type: 'string' } } } })
  async createReceiptCategory(@Body('name') name: string) {
    return await this.receiptsService.createReceiptCategory(name);
  }

  @Get('categories')
  @Roles('USER')
  async getAllReceiptCategories() {
    return await this.receiptsService.getAllReceiptCategories();
  }

  @Post('upload-receipt')
  @Roles('USER')
  @UsePipes(new ValidationPipe({ transform: true }))
  @UseInterceptors(FileInterceptor('receiptFile'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: UploadReceiptDto })
  async uploadReceipt(
    @UploadedFile() receiptFile: Express.Multer.File,
    @Body() dto: UploadReceiptDto,
    @User() user: jwtPayload,
  ) {
    return await this.receiptsService.uploadReceipt(user.sub, dto, receiptFile);
  }

  @Get('data')
  @Roles('USER')
  @ApiQuery({ name: 'search', required: false, type: 'string' })
  @ApiQuery({ name: 'filterCategory', required: false, type: 'string' })
  async getReceiptsData(
    @Query('search') search: string,
    @Query('filterCategory') filterCategory: string,
  ) {
    return await this.receiptsService.getReceiptsData(search, filterCategory);
  }
}
