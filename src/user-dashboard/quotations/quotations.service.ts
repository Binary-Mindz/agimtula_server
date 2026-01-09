import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
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

      return cResponseData({
        success: true,
        message: 'Quotation created successfully',
        data: quotation,
      });
    } catch (error) {
      console.error('Create quotation error:', error);
      throw new HttpException(
        'Failed to create quotation',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
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

      return cResponseData({
        success: true,
        message: 'Quotations retrieved successfully',
        data,
      });
    } catch (error) {
      console.error('Find all quotations error:', error);
      throw new HttpException(
        'Failed to retrieve quotations',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async findOne(id: number) {
    try {
      const data = await this.prisma.quotation.findUnique({
        where: { id },
      });

      if (!data) {
        throw new HttpException('Quotation not found', HttpStatus.NOT_FOUND);
      }

      return cResponseData({
        success: true,
        message: 'Quotation retrieved successfully',
        data,
      });
    } catch (error) {
      console.error('Find one quotation error:', error);
      throw new HttpException(
        'Failed to retrieve quotation',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async update(id: number, updateQuotationDto: UpdateQuotationDto) {
    try {
      const quotationExists = await this.prisma.quotation.findUnique({
        where: { id },
      });

      if (!quotationExists) {
        throw new HttpException('Quotation not found', HttpStatus.NOT_FOUND);
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

      return cResponseData({
        success: true,
        message: 'Quotation updated successfully',
        data: updatedQuotation,
      });
    } catch (error) {
      console.error('Update quotation error:', error);
      throw new HttpException(
        'Failed to update quotation',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async remove(id: number) {
    try {
      const quotationExists = await this.prisma.quotation.findUnique({
        where: { id },
      });

      if (!quotationExists) {
        throw new HttpException('Quotation not found', HttpStatus.NOT_FOUND);
      }

      await this.prisma.quotation.delete({
        where: { id },
      });

      return cResponseData({
        success: true,
        message: 'Quotation deleted successfully',
        data: quotationExists,
      });
    } catch (error) {
      console.error('Delete quotation error:', error);
      throw new HttpException(
        'Failed to delete quotation',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
