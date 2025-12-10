import {
  Body,
  Controller,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { ReceiptsService } from './receipts.service';
import { JwtAccessGuard } from 'src/auth/guards/jwt/jwt-access.guard';
import { UploadReceiptDto } from './dto/upload-receipt.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBody, ApiConsumes } from '@nestjs/swagger';
import { RolesGuard } from 'src/auth/guards/roles/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';

@Controller('receipts')
export class ReceiptsController {
  constructor(private readonly receiptsService: ReceiptsService) {}

  @Post('upload-receipt')
  @UseGuards(JwtAccessGuard, RolesGuard)
  @Roles('USER')
  @UsePipes(new ValidationPipe({ transform: true }))
  @UseInterceptors(FileInterceptor('receiptFile'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: UploadReceiptDto })
  async uploadReceipt(
    @UploadedFile() receiptFile: Express.Multer.File,
    @Body() dto: UploadReceiptDto,
  ) {
    return await this.receiptsService.uploadReceipt(dto, receiptFile);
  }
}
