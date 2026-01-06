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
      console.error(error);
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
      const invoices = await this.prisma.invoice.findMany({
        where: { ...query, isDrafted: false },
      });
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

  async getDrafts() {
    try {
      const drafts = await this.prisma.invoice.findMany({
        where: {
          isDrafted: true,
        },
      });

      return cResponseData({
        message: 'Drafts fetched successfully',
        data: drafts,
      });
    } catch (error) {
      return cResponseData({
        message: 'Failed to fetch drafts',
        error: 'Failed to fetch drafts',
        success: false,
      });
    }
  }

  async draftToInvoice(id: string) {
    try {
      const invoice = await this.prisma.invoice.update({
        where: {
          id,
        },
        data: {
          isDrafted: false,
        },
      });

      return cResponseData({
        message: 'Draft converted to invoice successfully',
        data: invoice,
      });
    } catch (error) {
      return cResponseData({
        message: 'Failed to convert draft to invoice',
        error: 'Failed to convert draft to invoice',
        success: false,
      });
    }
  }

  async deleteFromDraft(id: string) {
    try {
      const invoice = await this.prisma.invoice.findFirst({
        where: {
          id,
        },
      });

      if (!invoice) {
        return cResponseData({
          message: 'Invoice not found',
          error: 'Invoice not found',
          success: false,
        });
      }

      await this.prisma.invoice.delete({
        where: {
          id,
        },
      });
      return cResponseData({
        message: 'Invoice deleted successfully',
        data: invoice,
      });
    } catch (error) {
      return cResponseData({
        message: 'Failed to delete invoice',
        error: 'Failed to delete invoice',
        success: false,
      });
    }
  }


  remove(id: string) {
    try {
      const invoice = this.prisma.invoice.delete({
        where: {
          id,
        },
      });

      return cResponseData({
        message: 'Invoice deleted successfully',
        data: invoice,
      });
    } catch (error) {
      return cResponseData({
        message: 'Failed to delete invoice',
        error: 'Failed to delete invoice',
        success: false,
      });
    }
  }
}
