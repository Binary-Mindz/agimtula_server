/* eslint-disable @typescript-eslint/no-unused-vars */
import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateQuotationDto } from './dto/create-quotation.dto';
import { UpdateQuotationDto } from './dto/update-quotation.dto';
import { PrismaService } from 'src/config/database/prisma.service';
import { cResponseData } from 'src/common/cResponse';
import { QueryQuotationDto } from './dto/QueryQuotationDto';

@Injectable()
export class QuotationsService {
  constructor(private readonly prisma: PrismaService) {}
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
      return cResponseData({ data: quotation });
    } catch (error) {
      return new Error(`Failed to create quotation`);
    }
  }

  async findAll(query: QueryQuotationDto) {
    try {
      const data = await this.prisma.quotation.findMany({
        where: {
          ...(query.clientName && {
            clientName: {
              contains: query.clientName,
              mode: 'insensitive',
            },
          }),

          ...(query.status && {
            status: query.status,
          }),

          ...(query.amount && {
            amount: Number(query.amount),
          }),

          ...(query.date && {
            date: new Date(query.date),
          }),
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      return cResponseData({ data });
    } catch (error) {
      throw new Error(`Failed to fetch quotations`);
    }
  }

  async findOne(id: number) {
    try {
      const data = await this.prisma.quotation.findUnique({
        where: { id },
      });
      if (!data) {
        return cResponseData({ data: null });
      }
      return cResponseData({ data });
    } catch (error) {
      throw new Error(`Failed to fetch quotation`);
    }
  }

  async update(id: number, updateQuotationDto: UpdateQuotationDto) {
    try {
      const quotationExists = await this.prisma.quotation.findUnique({
        where: { id },
      });

      if (!quotationExists) {
        throw new NotFoundException('Quotation not found');
      }

      const updatedQuotation = await this.prisma.quotation.update({
        where: { id },
        data: {
          clientName: updateQuotationDto.clientName,
          clientEmail: updateQuotationDto.clientEmail,
          clientPhone: updateQuotationDto.clientPhone,
          ...(updateQuotationDto.date && {
            date: new Date(updateQuotationDto.date),
          }),
          amount: updateQuotationDto.amount,
          status: updateQuotationDto.status,
        },
      });

      return cResponseData({ data: updatedQuotation });
    } catch (error) {
      throw new Error(`Failed to update quotation`);
    }
  }

  async remove(id: number) {
    try {
      const quotationExists = await this.prisma.quotation.findUnique({
        where: { id },
      });

      if (!quotationExists) {
        throw new NotFoundException('Quotation not found');
      }
      await this.prisma.quotation.delete({
        where: { id },
      });
      return cResponseData({ data: quotationExists });
    } catch (error) {
      throw new Error(`Quotation deletion failed`);
    }
  }
}
