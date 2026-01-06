/* eslint-disable @typescript-eslint/no-unused-vars */
import { Injectable } from '@nestjs/common';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';
import { PrismaService } from 'src/config/database/prisma.service';
import { cResponseData } from 'src/common/cResponse';
import { SmtpMailService } from 'src/config/smtp-mail/smtp-mail.service';
import { invoiceEmailTemplate } from './invoice-email.template';

@Injectable()
export class InvoicesService {
  constructor(
    private prisma: PrismaService,
    private mail: SmtpMailService,
  ) {}

  async create(createInvoiceDto: CreateInvoiceDto) {
    try {
      const {
        serviceAndItems,
        businessDatas,
        addressAndContactInfo,
        issueDate,
        dueDate,
        ...invoiceData
      } = createInvoiceDto;

      const invoice = await this.prisma.invoice.findFirst({
        where: {
          invoiceNo: {
            equals: createInvoiceDto.invoiceNo,
            mode: 'insensitive',
          },
        },
      });

      if (invoice) {
        return cResponseData({
          message: 'Invoice already exists',
          success: false,
          error: 'Invoice already exists',
        });
      }

      // Convert date strings to Date objects
      const issueDateObj = new Date(issueDate);
      const dueDateObj = dueDate ? new Date(dueDate) : null;

      const newInvoice = await this.prisma.invoice.create({
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
          businessDatas: {
            create: businessDatas?.map((data) => ({
              businessIdLabel: data.businessIdLabel,
              businessIdValue: data.businessIdValue,
            })),
          },
        },
        include: {
          serviceAndItems: true,
        },
      });

      await this.mail.sendMail(
        createInvoiceDto.email,
        `Invoice #${newInvoice.invoiceNo}`,
        invoiceEmailTemplate(newInvoice),
      );
      return cResponseData({
        message: 'Invoice created successfully',
        data: newInvoice,
      });
    } catch (error) {
      return cResponseData({
        message: 'Failed to create invoice',
        error: 'Failed to create invoice',
        success: false,
      });
    }
  }


  async saveToDraft(dto: CreateInvoiceDto) {
    try {
      const {
        serviceAndItems,
        businessDatas,
        addressAndContactInfo,
        issueDate,
        dueDate,
        ...invoiceData
      } = dto;

      const invoice = await this.prisma.invoice.findFirst({
        where: {
          invoiceNo: {
            equals: dto.invoiceNo,
            mode: 'insensitive',
          },
        },
      });

      if (invoice) {
        return cResponseData({
          message: 'Invoice already exists',
          success: false,
          error: 'Invoice already exists',
        });
      }

      // Convert date strings to Date objects
      const issueDateObj = new Date(issueDate);
      const dueDateObj = dueDate ? new Date(dueDate) : null;

      const newInvoice = await this.prisma.invoice.create({
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
          businessDatas: {
            create: businessDatas?.map((data) => ({
              businessIdLabel: data.businessIdLabel,
              businessIdValue: data.businessIdValue,
            })),
          },
          isDrafted: true,
        },
        include: {
          serviceAndItems: true,
        },
      });

      return cResponseData({
        message: 'Invoice saved to draft successfully',
        data: newInvoice,
      });
    } catch (error) {
      return cResponseData({
        message: 'Failed to save invoice to draft',
        error: 'Failed to save invoice to draft',
        success: false,
      });
    }
  }
  async findAll(search: string) {
    const query = {};

    if (search) {
      query['OR'] = [
        {
          invoiceNo: {
            contains: search,
            mode: 'insensitive',
          },
        },
        {
          companyName: {
            contains: search,
            mode: 'insensitive',
          },
        },
      ];
    }

    try {
      const invoices = await this.prisma.invoice.findMany({ where: query });
      return cResponseData({
        message: 'Invoices fetched successfully',
        data: invoices,
      });
    } catch (error) {
      return cResponseData({
        message: 'Failed to fetch invoices',
        error: 'Failed to fetch invoices',
        success: false,
      });
    }
  }

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
