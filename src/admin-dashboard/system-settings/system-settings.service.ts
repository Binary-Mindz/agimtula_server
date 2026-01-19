import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/config/database/prisma.service';
import { UpdateVatRulesDto } from './dto/update-vat-rules.dto';
import { cResponseData } from 'src/common/cResponse';
// import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
// import { CreateEmailTemplateDto } from './dto/create-email-template.dto';
// import { cResponseData } from 'src/common/cResponse';
// import { TestDto } from './dto/test-dto';
// import { render } from 'src/common/emailRenderer';
// import { SmtpMailService } from 'src/config/smtp-mail/smtp-mail.service';

@Injectable()
export class SystemSettingsService {
  constructor(
    private prisma: PrismaService,
    // private mail: SmtpMailService,
  ) {}
/** Email Template

  async create(dto: CreateEmailTemplateDto) {
    try {
      const createdTemplate = await this.prisma.emailTemplate.create({
        data: {
          key: dto.key,
          name: dto.name,
          description: dto.description,
          subject: dto.subject,
          bodyHtml: dto.bodyHtml,
          variables: dto.variables,
        },
      });

      if (!createdTemplate) {
        throw new HttpException(
          'Failed to create email template',
          HttpStatus.BAD_REQUEST,
        );
      }

      return cResponseData({
        data: createdTemplate,
        message: 'Email template created successfully',
      });
    } catch (error) {
      console.error('Create email template error:', error);
      throw new HttpException(
        'Failed to create email template',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async findAll() {
    try {
      const templates = await this.prisma.emailTemplate.findMany({
        select: {
          key: true,
          name: true,
          isActive: true,
        },
      });
      return cResponseData({
        data: templates,
        message: 'Email templates retrieved successfully',
      });
    } catch (error) {
      console.error('Find all email templates error:', error);
      throw new HttpException(
        'Failed to retrieve email templates',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async update(id: string, dto: Partial<CreateEmailTemplateDto>) {
    try {
      if (!id) {
        throw new HttpException('Template ID is required', HttpStatus.BAD_REQUEST);
      }

      const existing = await this.prisma.emailTemplate.findUnique({
        where: { id },
      });

      if (!existing) {
        throw new HttpException('Email template not found', HttpStatus.NOT_FOUND);
      }

      const updated = await this.prisma.emailTemplate.update({
        where: { id },
        data: {
          key: dto.key,
          name: dto.name,
          description: dto.description,
          subject: dto.subject,
          bodyHtml: dto.bodyHtml,
          variables: dto.variables,
        },
      });
      return cResponseData({
        data: updated,
        message: 'Email template updated successfully',
      });
    } catch (error) {
      console.error('Update email template error:', error);
      throw new HttpException(
        'Failed to update email template',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async remove(id: string) {
    try {
      if (!id) {
        throw new HttpException('Template ID is required', HttpStatus.BAD_REQUEST);
      }

      const existing = await this.prisma.emailTemplate.findUnique({
        where: { id },
      });

      if (!existing) {
        throw new HttpException('Email template not found', HttpStatus.NOT_FOUND);
      }

      await this.prisma.emailTemplate.delete({
        where: { id },
      });
      return cResponseData({
        message: 'Email template removed successfully',
        data: { id },
      });
    } catch (error) {
      console.error('Remove email template error:', error);
      throw new HttpException(
        'Failed to remove email template',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async testApi(dto: TestDto) {
    try {
      const template = await this.prisma.emailTemplate.findFirst({
        where: {
          key: 'WELCOME_EMAIL',
        },
      });

      if (!template) {
        throw new HttpException(
          'No email template found for testing',
          HttpStatus.NOT_FOUND,
        );
      }

      const subject = render(template.subject, dto.data);
      const html = render(template.bodyHtml, dto.data);

      await this.mail.sendMail(dto.to, subject, html);

      return cResponseData({
        message: 'Test email sent successfully',
      });
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      console.error('Test email error:', error);
      throw new HttpException(
        'Failed to send test email',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
*/
  
  /** Vat Rules */

  async updateVatRules(dto: UpdateVatRulesDto) {
    try {
      const updatedRules: any[] = [];
      
      for (const rule of dto.vatRules) {
        const existing = await this.prisma.vatRate.findFirst({
          where: { code: rule.countryCode }
        });

        if (existing) {
          const updated = await this.prisma.vatRate.update({
            where: { id: existing.id },
            data: {
              standardRate: rule.standardRate ?? existing.standardRate,
              reducedRate: rule.reducedRate ?? existing.reducedRate,
            },
          });
          updatedRules.push(updated);
        }
      }

      return cResponseData({
        message: "Updated vat rules",
        data: updatedRules
      })
    } catch (error) {
      if (error instanceof HttpException) {
        throw error
      }
      throw new HttpException(
        'Failed to update vat rules',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getVatRules() {
    try {
      const vatRules = await this.prisma.vatRate.findMany()

      return cResponseData({
        data:vatRules
      })
    } catch (error) {
      if (error instanceof HttpException) {
        throw error
      }
      throw new HttpException(
        'Failed to get vat rules',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
