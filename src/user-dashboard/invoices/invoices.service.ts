/* eslint-disable @typescript-eslint/no-unused-vars */
import { ForbiddenException, Injectable } from '@nestjs/common';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';
import { PrismaService } from 'src/config/database/prisma.service';
import { cResponseData } from 'src/common/cResponse';
import { SmtpMailService } from 'src/config/smtp-mail/smtp-mail.service';
import { invoiceEmailTemplate } from './invoice-email.template';
import Stripe from 'stripe';

@Injectable()
export class InvoicesService {
  public stripe: Stripe;

  constructor(
    private prisma: PrismaService,
    private mail: SmtpMailService,
  ) {
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
      apiVersion: '2025-12-15.clover',
    });
  }

  async create(createInvoiceDto: CreateInvoiceDto, userId: string) {
    try {
      const {
        serviceAndItems,
        businessDatas,
        addressAndContactInfo,
        issueDate,
        dueDate,
        isPaymentLinkIncluded,
        ...invoiceData
      } = createInvoiceDto;

      let isPaid: boolean = !isPaymentLinkIncluded;

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

      // Logic for isPaid based on due date and payment link
      if (dueDateObj) {
        if (dueDateObj < new Date()) {
          // Past due date - always false
          isPaid = false;
        } else {
          // Future due date - true if no payment link, false if payment link included
          isPaid = !isPaymentLinkIncluded;
        }
      }

      const newInvoice = await this.prisma.invoice.create({
        data: {
          userId,
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
          invoiceSource: 'MANUAL',
          isPaid,
        },
        include: {
          serviceAndItems: true,
        },
      });

      let session: any;
      if (isPaymentLinkIncluded && dueDateObj && dueDateObj > new Date()) {
        session = await this.stripe.checkout.sessions.create({
          customer_email: createInvoiceDto.email,
          line_items: [
            {
              price_data: {
                currency: 'usd',
                product_data: {
                  name: newInvoice.companyName,
                },
                unit_amount: newInvoice.totalAmount * 100,
              },
              quantity: 1,
            },
          ],
          mode: 'payment',
          success_url: `${process.env.FRONTEND_URL}/invoice/${newInvoice.id}`,
          cancel_url: `${process.env.FRONTEND_URL}/invoice/${newInvoice.id}`,
          metadata: {
            invoiceId: newInvoice.id,
          },
        });

        await this.prisma.invoice.update({
          where: { id: newInvoice.id },
          data: {
            stripeSessionId: session.id,
            isPaid: false,
          },
        });
      }

      await this.mail.sendMail(
        createInvoiceDto.email,
        `Invoice #${newInvoice.invoiceNo}`,
        invoiceEmailTemplate({
          ...newInvoice,
          mobilePaymentLink:
            isPaymentLinkIncluded && session ? session.url : null,
        }),
      );

      return cResponseData({
        message: 'Invoice created successfully',
        data: newInvoice,
      });
    } catch (error) {
      console.error('Invoice creation error:', error);
      return cResponseData({
        message: 'Failed to create invoice',
        error: 'Failed to create invoice',
        success: false,
      });
    }
  }

  async saveToDraft(dto: CreateInvoiceDto, userId: string) {
    try {
      const {
        serviceAndItems,
        businessDatas,
        addressAndContactInfo,
        issueDate,
        dueDate,
        isPaymentLinkIncluded,
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
          userId,
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
          invoiceSource: 'MANUAL',
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
  async findAll(search: string, page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;
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
      const [invoices, totalRecords] = await Promise.all([
        this.prisma.invoice.findMany({
          where: { ...query, isDrafted: false },
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
        }),
        this.prisma.invoice.count({
          where: { ...query, isDrafted: false },
        }),
      ]);

      const totalPages = Math.ceil(totalRecords / limit);

      return cResponseData({
        message: 'Invoices fetched successfully',
        data: {
          invoices: invoices.map((inv) => ({
            invoiceNo: inv.invoiceNo,
            client: inv.companyName,
            date: inv.issueDate,
            amount: inv.totalAmount,
            status:
              inv.dueDate && inv.dueDate < new Date()
                ? 'Overdue'
                : inv.isPaid
                  ? 'Paid'
                  : 'Unpaid',
          })),
          pagination: {
            currentPage: page,
            totalPages,
            totalRecords,
            limit,
            hasNext: page < totalPages,
            hasPrev: page > 1,
          },
        },
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

  async remove(id: string) {
    try {
      const invoice = await this.prisma.invoice.delete({
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

  async exportInvoices(userId: string) {
    try {
      const invoices = await this.prisma.invoice.findMany({
        where: {
          userId,
          isDrafted: false,
        },
      });

      if (invoices.length === 0) {
        throw new ForbiddenException('No invoices found');
      }

      return cResponseData({
        success: true,
        message: 'Invoices exported successfully',
        data: invoices,
      });
    } catch (error) {
      return cResponseData({
        success: false,
        message: 'Failed to export invoices',
      });
    }
  }
}
