import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { ReceiptsService } from './receipts.service';
import { UploadReceiptDto } from './dto/upload-receipt.dto';
import { ApiBody, ApiOperation, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { User } from 'src/auth/decorators/user.decorator';
import { jwtPayload } from 'src/auth/types/jwt-payload';
import { UpdateReceiptDto } from './dto/update-receipt-dto';
import { urlPrefix } from '../url-prefix';

@Controller(`${urlPrefix}/receipts`)
export class UserReceiptsController {
  constructor(private readonly receiptsService: ReceiptsService) { }


  @Post('create-category')
  @Roles('ADMIN')
  @UsePipes(new ValidationPipe({ transform: true }))
  @ApiBody({ schema: { properties: { name: { type: 'string' } } } })
  @ApiResponse({ status: 201, description: 'Category created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid category name' })
  @ApiOperation({ summary: 'Create new receipt category ( ADMIN only )' })
  async createReceiptCategory(@Body('name') name: string) {
    return await this.receiptsService.createReceiptCategory(name);
  }

  @Get('categories')
  @Roles('USER', 'ADMIN')
  @ApiOperation({ summary: 'Get all receipt categories ( USER and ADMIN )' })
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
  @ApiOperation({ summary: 'Delete receipt category ( ADMIN only )' })
  @ApiResponse({ status: 204, description: 'Category deleted successfully' })
  @ApiResponse({ status: 404, description: 'Category not found' })
  async deleteCategory(@Param('id') id: string) {
    return await this.receiptsService.deleteCategory(id);
  }

  // receipt info

  @Post('upload-receipt')
  @Roles('USER')
  @ApiBody({ type: UploadReceiptDto })
  @ApiResponse({ status: 201, description: 'Receipt uploaded successfully' })
  @ApiResponse({ status: 400, description: 'Invalid receipt data' })
  @ApiOperation({ summary: 'Upload new receipt ( USER only )' })
  async uploadReceipt(
    @Body() dto: UploadReceiptDto,
    @User() user: jwtPayload,
  ) {
    return await this.receiptsService.uploadReceipt(user.sub, dto);
  }

  @Get('data')
  @Roles('USER')
  @ApiQuery({ name: 'search', required: false, type: 'string', description: 'Search by vendor name' })
  @ApiQuery({ name: 'filterCategory', required: false, type: 'string', description: 'Filter by category name' })
  @ApiQuery({ name: 'page', required: false, type: 'number', description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: 'number', description: 'Items per page (default: 10)' })
  @ApiResponse({
    status: 200,
    description: 'Receipts data retrieved successfully with pagination',
    schema: {
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
        data: {
          type: 'object',
          properties: {
            receipts: { type: 'array' },
            pagination: {
              type: 'object',
              properties: {
                currentPage: { type: 'number' },
                totalPages: { type: 'number' },
                totalRecords: { type: 'number' },
                limit: { type: 'number' },
                hasNext: { type: 'boolean' },
                hasPrev: { type: 'boolean' },
              },
            },
          },
        },
      },
    },
  })
  @ApiOperation({ summary: 'Get receipts data with pagination and filtering ( USER only )' })
  async getReceiptsData(
    @User() user: jwtPayload,
    @Query('search') search?: string,
    @Query('filterCategory') filterCategory?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return await this.receiptsService.getReceiptsData(
      user.sub,
      search,
      filterCategory,
      page || 1,
      limit || 10,
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
  @ApiOperation({ summary: 'Update receipt data ( USER only )' })
  async updateReceipt(@Body('id') id: string, @Body() dto: UpdateReceiptDto) {
    return await this.receiptsService.updateReceiptsData(id, dto);
  }

  @Delete('delete-receipt')
  @Roles('USER')
  @ApiOperation({ summary: 'Delete receipt ( USER only )' })
  @UsePipes(new ValidationPipe({ transform: true }))
  @ApiResponse({ status: 204, description: 'Receipt deleted successfully' })
  @ApiResponse({ status: 404, description: 'Receipt not found' })
  async deleteReceipt(@Param('id') id: string) {
    return await this.receiptsService.deleteReceiptsData(id);
  }
}
