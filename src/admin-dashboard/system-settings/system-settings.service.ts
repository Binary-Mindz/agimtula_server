import { HttpException, Injectable } from '@nestjs/common';
import { CreateEmailTemplateDto } from './dto/create-email-template.dto';
import { PrismaService } from 'src/config/database/prisma.service';
import { cResponseData } from 'src/common/cResponse';
import { TestDto } from './dto/test-dto';
import { SmtpMailService } from 'src/config/smtp-mail/smtp-mail.service';
import { render } from 'src/common/emailRenderer';

@Injectable()
export class SystemSettingsService {
  constructor(
    private prisma: PrismaService,
    private mail: SmtpMailService,
  ) {}

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
          cResponseData({
            message: 'Failed to create email template',
          }),
          400,
        );
      }

      return cResponseData({
        data: createdTemplate,
        message: 'Email template created successfully',
      });
    } catch (error) {
      throw new HttpException(
        cResponseData({
          message: 'Failed to create email template',
          error: error.message,
        }),
        400,
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
      return cResponseData({
        message: 'Failed to retrieve email templates',
        error: error.message,
      });
    }
  }

  async update(id: string, dto: Partial<CreateEmailTemplateDto>) {
    try {
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
      throw new HttpException(
        cResponseData({
          message: 'Failed to update email template',
          error: error.message,
        }),
        400,
      );
    }
  }

  async remove(id: string) {
    try {
      await this.prisma.emailTemplate.delete({
        where: { id },
      });
      return cResponseData({
        message: 'Email template removed successfully',
        data: { id },
      });
    } catch (error) {
      throw new HttpException(
        cResponseData({
          message: 'Failed to remove email template',
          error: error.message,
        }),
        400,
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
          {
            message: 'No email template found for testing',
          },
          400,
        );
      }

      const subject = render(template.subject, dto.data);
      const html = render(template.bodyHtml, dto.data);

      await this.mail.sendMail(dto.to, subject, html);
      
      return cResponseData({
        message: 'Test email sent successfully',
      });
    } catch (error) {
      return cResponseData({
        message: 'Failed to send test email',
        error: error.message,
      });
    }
  }
}
