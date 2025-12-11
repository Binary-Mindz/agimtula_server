import { Injectable } from '@nestjs/common';
import { BusinessInfoDto } from './dto/business-info.dto';
import { PaymentMethodDto } from './dto/payment-method.dto';
import { InvoiceLayoutDto } from './dto/invoice-layout.dto';

@Injectable()
export class SettingsService {
  async updateBusinessInfo(dto: BusinessInfoDto, file: Express.Multer.File) {
    return await { dto, file: file.originalname };
  }

  async paymentMethod(dto: PaymentMethodDto) {
    return await { dto };
  }

  async invoiceLayout(dto: InvoiceLayoutDto) {
    return await { dto };
  }
}
