/* eslint-disable @typescript-eslint/no-unused-vars */
import { Injectable } from '@nestjs/common';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';
import { PrismaService } from 'src/config/database/prisma.service';
import { cResponseData } from 'src/common/cResponse';

@Injectable()
export class InvoicesService {
  constructor(private prisma: PrismaService) {}

  async create(createInvoiceDto: CreateInvoiceDto) {
    try {
      const {
        serviceAndItems,
        addressAndContactInfo,
        issueDate,
        dueDate,
        ...invoiceData
      } = createInvoiceDto;

      // if(createInvoiceDto.invoiceNo) {
      //   const invoice = await this.prisma.invoice.findUnique({
      //     where: {
      //       invoiceNo: createInvoiceDto.invoiceNo,
      //     },
      //   });
      // }

      // if(invoice) {
      //   return cResponseData({
      //     message: 'Invoice already exists',
      //     data: invoice,
      //   });
      // }

      // Convert date strings to Date objects
      const issueDateObj = new Date(issueDate);
      const dueDateObj = dueDate ? new Date(dueDate) : null;

      const invoice = await this.prisma.invoice.create({
        data: {
          ...invoiceData,
          issueDate: issueDateObj,
          dueDate: dueDateObj,
          AddressAndContactInfo: addressAndContactInfo,
          serviceAndItems: {
            create: serviceAndItems.map((item) => ({
              description: item.description,
              qty: item.qty,
              rate: item.rate,
              totalAmount: item.totalAmount,
            })),
          },
        },
        include: {
          serviceAndItems: true,
        },
      });
      return cResponseData({
        message: 'Invoice created successfully',
        data: invoice,
      });
    } catch (error) {
      return cResponseData({
        message: 'Failed to create invoice',
        error: error.message || 'Failed to create invoice',
        success: false,
      });
    }
  }

  findAll() {}

  findOne(id: number) {
    return `This action returns a #${id} invoice`;
  }

  update(id: number, updateInvoiceDto: UpdateInvoiceDto) {
    return `This action updates a #${id} invoice`;
  }

  remove(id: number) {
    return `This action removes a #${id} invoice`;
  }
}
