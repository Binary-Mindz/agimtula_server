import {
  ForbiddenException,
  Injectable,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { CreateAccountantDto } from './dto/create-accountant.dto';
import { PrismaService } from 'src/config/database/prisma.service';
import * as bcrypt from 'bcrypt';
import { cResponseData } from 'src/common/cResponse';
import { SmtpMailService } from 'src/config/smtp-mail/smtp-mail.service';

@Injectable()
export class AccountantsService {
  constructor(
    private Prisma: PrismaService,
    private readonly mail: SmtpMailService,
  ) {}

  async create(createAccountantDto: CreateAccountantDto) {
    try {
      const isUser = await this.Prisma.user.findFirst({
        where: {
          email: {
            email: createAccountantDto.email,
          },
        },
      });

      if (isUser) {
        throw new HttpException('Account already exists', HttpStatus.CONFLICT);
      }

      const pass = `Pass_${Math.floor(Math.random() * 100000)}`;
      const hashedPass = await bcrypt.hash(pass, 10);

      const accountant = await this.Prisma.user.create({
        data: {
          profile: {
            create: {
              firstName: createAccountantDto.firstName,
              lastName: createAccountantDto.lastName,
            },
          },
          email: {
            create: {
              email: createAccountantDto.email,
            },
          },
          password: hashedPass,
          role: 'ACCOUNTANT',
        },
      });

      await this.mail.sendMail(
        createAccountantDto.email,
        'Your Accountant account Password',
        `
        <h2>Your Accountant Account password is</h2>
        <h3 style="color: green; background: #ccc; padding: 10px; border-radius: 5px; display: inline-block">${pass}</h3>
        <p>Please change your password after login</p>
        `,
      );

      const { password, ...accountantData } = accountant;
      if (!password) {
        throw new ForbiddenException('Password not found');
      }
      return cResponseData({
        success: true,
        message: 'Accountant created successfully',
        data: accountantData,
      });
    } catch (error) {
      console.error('Create accountant error:', error);
      throw new HttpException(
        'Failed to create accountant',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async findAll() {
    try {
      const accountants = await this.Prisma.user.findMany({
        where: {
          role: 'ACCOUNTANT',
          isDeleted: false,
        },
        include: {
          profile: true,
          email: true,
        },
      });

      return cResponseData({
        success: true,
        message: 'Accountants retrieved successfully',
        data: accountants,
      });
    } catch (error) {
      console.error('Find all accountants error:', error);
      throw new HttpException(
        'Failed to retrieve accountants',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
