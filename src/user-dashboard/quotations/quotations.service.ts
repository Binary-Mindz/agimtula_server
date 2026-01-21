import { Injectable, HttpException, HttpStatus, NotFoundException, InternalServerErrorException } from '@nestjs/common';
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
      const userExists = await this.prisma.user.findUnique({
        where: { id: userId },
      });

      if (!userExists) {
        throw new NotFoundException('User not found');
      }



      const quotation = await this.prisma.quotation.create({
        data: {
          clientName: createQuotationDto.clientName,
          clientEmail: createQuotationDto.clientEmail,
          clientPhone: createQuotationDto.clientPhone,
          date: new Date(createQuotationDto.date),
          amount: createQuotationDto.amount,
          status: createQuotationDto.status ,
          senderId: userId,
        },
      });

      return cResponseData({
        success: true,
        message: 'Quotation created successfully',
        data: quotation,
      });
    } catch (error) {
      if (error instanceof HttpException || error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Internal server error while creating quotation');
                                                         
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
      if (error instanceof HttpException) {
        throw error;
      }
      console.error('Find all quotations error:', error);
      throw new HttpException(
        'Failed to retrieve quotations',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async findOne(id: number) {
    try {
      if (!id) {
        throw new HttpException('Quotation ID is required', HttpStatus.BAD_REQUEST);
      }

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
      if (error instanceof HttpException) {
        throw error;
      }
      console.error('Find one quotation error:', error);
      throw new HttpException(
        'Failed to retrieve quotation',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async update(id: number, updateQuotationDto: UpdateQuotationDto) {
    try {
      if (!id) {
        throw new HttpException('Quotation ID is required', HttpStatus.BAD_REQUEST);
      }

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

      return cResponseData({
        success: true,
        message: 'Quotation updated successfully',
        data: updatedQuotation,
      });
    } catch (error) {
      if (error instanceof HttpException || error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Internal server error while updating quotation');
    
    }
  }

  async remove(id: number) {
    try {
      if (!id) {
        throw new HttpException('Quotation ID is required', HttpStatus.BAD_REQUEST);
      } 

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
      if (error instanceof HttpException) {
        throw error;
      }
      console.error('Delete quotation error:', error);
      throw new HttpException(
        'Failed to delete quotation',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
