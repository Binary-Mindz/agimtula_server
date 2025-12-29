import { Injectable } from '@nestjs/common';
import { CreateQuotationDto } from './dto/create-quotation.dto';
import { UpdateQuotationDto } from './dto/update-quotation.dto';
import { PrismaService } from 'src/config/database/prisma.service';
import { cResponseData } from 'src/common/cResponse';

@Injectable()
export class QuotationsService {
  constructor(
    private readonly prisma: PrismaService) { }
  async create(createQuotationDto: CreateQuotationDto, userId: string) {


    try {
      const quotation = await this.prisma.quotation.create({
        data: {
          clientName: createQuotationDto.clientName,
          clientEmail: createQuotationDto.clientEmail,
          clientPhone: createQuotationDto.clientPhone,
          date: new Date(createQuotationDto.date),
          amount: createQuotationDto.amount,
          status: createQuotationDto.status,
          senderId: userId,
        },
      });
      return cResponseData(quotation);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return new Error(`Failed to create quotation: ${message}`);
    }
  }

  findAll() {
    return `This action returns all quotations`;
  }

  findOne(id: number) {
    return `This action returns a #${id} quotation`;
  }

  update(id: number, updateQuotationDto: UpdateQuotationDto) {
    return `This action updates a #${id} quotation`;
  }

  remove(id: number) {
    return `This action removes a #${id} quotation`;
  }
}
