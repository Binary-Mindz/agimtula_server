import { Injectable } from '@nestjs/common';
import { UploadReceiptDto } from './dto/upload-receipt.dto';

@Injectable()
export class ReceiptsService {
  async uploadReceipt(dto: UploadReceiptDto, file: Express.Multer.File) {
    return { dto, name: file.originalname };
  }
}
