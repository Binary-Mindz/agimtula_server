import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
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
import { ApiBody, ApiConsumes, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { User } from 'src/auth/decorators/user.decorator';
import { jwtPayload } from 'src/auth/types/jwt-payload';
import { UpdateReceiptDto } from './dto/update-receipt-dto';
import { urlPrefix } from '../url-prefix';

@Controller(`${urlPrefix}/receipts`)
export class UserReceiptsController {
  constructor(private readonly receiptsService: ReceiptsService) {}

  // Receipt Category

  @Post('create-category')
  @Roles('ADMIN')
  @UsePipes(new ValidationPipe({ transform: true }))
  @ApiBody({ schema: { properties: { name: { type: 'string' } } } })
  @ApiResponse({ status: 201, description: 'Category created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid category name' })
  async createReceiptCategory(@Body('name') name: string) {
    return await this.receiptsService.createReceiptCategory(name);
  }

  @Get('categories')
  @Roles('USER', 'ADMIN')
  @ApiResponse({
    status: 200,
    description: 'Categories retrieved successfully',
  })
  async getAllReceiptCategories() {
    return await this.receiptsService.getAllReceiptCategories();
  }

  @Delete('delete-category/:id')
  @Roles('ADMIN')
  @UsePipes(new ValidationPipe({ transform: true }))
  @ApiResponse({ status: 204, description: 'Category deleted successfully' })
  @ApiResponse({ status: 404, description: 'Category not found' })
  async deleteCategory(@Param('id') id: string) {
    return await this.receiptsService.deleteCategory(id);
  }

  // receipt info

  @Post('upload-receipt')
  @Roles('USER')
  @UsePipes(new ValidationPipe({ transform: true }))
  @UseInterceptors(FileInterceptor('receiptFile'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: UploadReceiptDto })
  @ApiResponse({ status: 201, description: 'Receipt uploaded successfully' })
  @ApiResponse({ status: 400, description: 'Invalid receipt data or file' })
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
  @ApiResponse({
    status: 200,
    description: 'Receipts data retrieved successfully',
  })
  async getReceiptsData(
    @Query('search') search: string,
    @Query('filterCategory') filterCategory: string,
    @User() user: jwtPayload,
  ) {
    return await this.receiptsService.getReceiptsData(
      user.sub,
      search,
      filterCategory,
    );
  }

  @Patch('update-receipt')
  @Roles('USER')
  @UsePipes(new ValidationPipe({ transform: true }))
  @ApiBody({
    schema: {
      properties: {
        id: { type: 'string' },
        vendor: { type: 'string' },
        amount: { type: 'number' },
        date: { type: 'string' },
        category: { type: 'string' },
        notes: { type: 'string' },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Receipt updated successfully' })
  @ApiResponse({ status: 404, description: 'Receipt not found' })
  async updateReceipt(@Body('id') id: string, @Body() dto: UpdateReceiptDto) {
    return await this.receiptsService.updateReceiptsData(id, dto);
  }

  @Delete('delete-receipt')
  @Roles('USER')
  @UsePipes(new ValidationPipe({ transform: true }))
  @ApiResponse({ status: 204, description: 'Receipt deleted successfully' })
  @ApiResponse({ status: 404, description: 'Receipt not found' })
  async deleteReceipt(@Param('id') id: string) {
    return await this.receiptsService.deleteReceiptsData(id);
  }
}
