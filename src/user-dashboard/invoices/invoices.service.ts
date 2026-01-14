/* eslint-disable @typescript-eslint/no-unused-vars */
import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';
import { PrismaService } from 'src/config/database/prisma.service';
import { cResponseData } from 'src/common/cResponse';
import { SmtpMailService } from 'src/config/smtp-mail/smtp-mail.service';
import { invoiceEmailTemplate } from './invoice-email.template';
import Stripe from 'stripe';
import { NotFoundAppException } from 'src/common/app-exceptions';

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
      // Check subscription and invoice limit
      const subscription = await this.prisma.userSubscriptionPlan.findFirst({
        where: { UserId: userId, isActive: true },
      });

      if (subscription && subscription.isLimitedInvoicePerMonth) {
        const currentMonth = new Date();
        const startOfMonth = new Date(
          currentMonth.getFullYear(),
          currentMonth.getMonth(),
          1,
        );
        const endOfMonth = new Date(
          currentMonth.getFullYear(),
          currentMonth.getMonth() + 1,
          0,
        );

        const invoiceCount = await this.prisma.invoice.count({
          where: {
            userId,
            createdAt: {
              gte: startOfMonth,
              lte: endOfMonth,
            },
          },
        });

        if (invoiceCount >= subscription.perMonthInvoiceCount) {
          throw new HttpException(
            `Monthly invoice limit reached (${subscription.perMonthInvoiceCount}). Upgrade your plan to create more invoices.`,
            HttpStatus.FORBIDDEN,
          );
        }
      }
      
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
      if (error instanceof HttpException) {
        throw error;
      }
      console.error('Create invoice error:', error);
      throw new HttpException(
        'Failed to create invoice',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
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
      if (error instanceof HttpException) {
        throw error;
      }
      console.error('Save to draft error:', error);
      throw new HttpException(
        'Failed to save invoice to draft',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
  async findAll(
    search: string,
    page: number = 1,
    limit: number = 10,
    userId: string,
  ) {
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
          where: {
            ...query,
            isDrafted: false,
            userId,
          },
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
        }),
        this.prisma.invoice.count({
          where: {
            ...query,
            isDrafted: false,
            userId,
          },
        }),
      ]);

      const totalPages = Math.ceil(totalRecords / limit);

      return cResponseData({
        message: 'Invoices fetched successfully',
        data: {
          invoices: invoices.map((inv) => ({
            ...inv,

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
      if (error instanceof HttpException) {
        throw error;
      }
      console.error('Find all invoices error:', error);
      throw new HttpException(
        'Failed to fetch invoices',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
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
      if (error instanceof HttpException) {
        throw error;
      }
      console.error('Get drafts error:', error);
      throw new HttpException(
        'Failed to fetch drafts',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async draftToInvoice(id: string, isPaymentLinkIncluded?: boolean) {
    try {
      const draft = await this.prisma.invoice.findFirst({
        where: { id, isDrafted: true },
      });

      if (!draft) {
        return cResponseData({
          message: 'Draft not found',
          error: 'Draft not found',
          success: false,
        });
      }

      let isPaid = !isPaymentLinkIncluded;
      let session: any;

      // Logic for isPaid based on due date and payment link
      if (draft.dueDate) {
        if (draft.dueDate < new Date()) {
          isPaid = false;
        } else {
          isPaid = !isPaymentLinkIncluded;
        }
      }

      const invoice = await this.prisma.invoice.update({
        where: { id },
        data: {
          isDrafted: false,
          isPaid,
        },
      });

      // Create payment session if payment link is included and due date is in future
      if (
        isPaymentLinkIncluded &&
        draft.dueDate &&
        draft.dueDate > new Date()
      ) {
        session = await this.stripe.checkout.sessions.create({
          customer_email: draft.email,
          line_items: [
            {
              price_data: {
                currency: 'usd',
                product_data: {
                  name: draft.companyName,
                },
                unit_amount: draft.totalAmount * 100,
              },
              quantity: 1,
            },
          ],
          mode: 'payment',
          success_url: `${process.env.FRONTEND_URL}/invoice/${draft.id}`,
          cancel_url: `${process.env.FRONTEND_URL}/invoice/${draft.id}`,
          metadata: {
            invoiceId: draft.id,
          },
        });

        await this.prisma.invoice.update({
          where: { id },
          data: {
            stripeSessionId: session.id,
            isPaid: false,
          },
        });

        // Send email with payment link
        await this.mail.sendMail(
          draft.email,
          `Invoice #${draft.invoiceNo}`,
          invoiceEmailTemplate({
            ...draft,
            mobilePaymentLink: session.url,
          }),
        );
      }

      return cResponseData({
        message: 'Draft converted to invoice successfully',
        data: {
          invoice,
          paymentUrl: session?.url || null,
        },
      });
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      console.error('Draft to invoice error:', error);
      throw new HttpException(
        'Failed to convert draft to invoice',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
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
      if (error instanceof HttpException) {
        throw error;
      }
      console.error('Delete from draft error:', error);
      throw new HttpException(
        'Failed to delete invoice',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async findOne(id: string, userId: string) {
    try {
      const invoice = await this.prisma.invoice.findFirst({
        where: {
          id,
          userId,
        },
        include: {
          serviceAndItems: true,
          businessDatas: true,
        },
      });

      if (!invoice) {
        return cResponseData({
          message: 'Invoice not found',
          error: 'Invoice not found',
          success: false,
        });
      }

      return cResponseData({
        message: 'Invoice fetched successfully',
        data: invoice,
      });
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      console.error('Find one invoice error:', error);
      throw new HttpException(
        'Failed to fetch invoice',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async update(id: string, updateInvoiceDto: UpdateInvoiceDto, userId: string) {
    try {
      const {
        serviceAndItems,
        businessDatas,
        addressAndContactInfo,
        issueDate,
        dueDate,
        isPaymentLinkIncluded,
        ...invoiceData
      } = updateInvoiceDto;

      const existingInvoice = await this.prisma.invoice.findFirst({
        where: {
          id,
          userId,
        },
      });

      if (!existingInvoice) {
        return cResponseData({
          message: 'Invoice not found',
          error: 'Invoice not found',
          success: false,
        });
      }

      // Convert date strings to Date objects

      const dueDateObj = dueDate ? new Date(dueDate) : null;

      // Update invoice with new data
      const updatedInvoice = await this.prisma.invoice.update({
        where: { id },
        data: {
          ...invoiceData,
          dueDate: dueDateObj,
          AddressAndContactInfo: addressAndContactInfo,
          serviceAndItems: {
            create: serviceAndItems?.map((item) => ({
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
          businessDatas: true,
        },
      });
      return cResponseData({
        message: 'Invoice updated successfully',
        data: updatedInvoice,
      });
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      console.error('Update invoice error:', error);
      throw new HttpException(
        'Failed to update invoice',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async delete(id: string, userId: string) {
    try {
      const invoice = await this.prisma.invoice.findFirst({
        where: {
          id,
          userId,
        },
      });

      if (!invoice) {
        return cResponseData({
          message: 'Invoice not found',
          error: 'Invoice not found',
          success: false,
        });
      }

      // Delete relations first (Prisma should handle this with cascade, but being explicit)
      await this.prisma.serviceAndItem.deleteMany({
        where: { invoiceId: id },
      });

      await this.prisma.businessData.deleteMany({
        where: { invoiceId: id },
      });

      // Delete the invoice
      await this.prisma.invoice.delete({
        where: { id },
      });

      return cResponseData({
        message: 'Invoice deleted successfully',
        data: { id },
      });
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      console.error('Delete invoice error:', error);
      throw new HttpException(
        'Failed to delete invoice',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
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
        throw new NotFoundAppException('No invoices found');
      }

      return cResponseData({
        success: true,
        message: 'Invoices exported successfully',
        data: invoices,
      });
    } catch (error) {
      if (error instanceof NotFoundAppException) {
        throw error;
      }
      console.error('Export invoices error:', error);
      throw new HttpException(
        'Failed to export invoices',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
