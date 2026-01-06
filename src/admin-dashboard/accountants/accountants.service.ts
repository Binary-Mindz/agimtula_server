/* eslint-disable @typescript-eslint/no-unused-vars */
import { ForbiddenException, Injectable } from '@nestjs/common';
import { CreateAccountantDto } from './dto/create-accountant.dto';
import { UpdateAccountantDto } from './dto/update-accountant.dto';
import { PrismaService } from 'src/config/database/prisma.service';
import * as bcrypt from 'bcrypt';
import { cResponseData } from 'src/common/cResponse';
import { SmtpMailService } from 'src/config/smtp-mail/smtp-mail.service';

@Injectable()
export class AccountantsService {
  constructor(
    private Prisma: PrismaService,
    private readonly mail: SmtpMailService,
  ) { }

  async create(createAccountantDto: CreateAccountantDto) {
    const isUser = await this.Prisma.user.findFirst({
      where: {
        email: {
          email: createAccountantDto.email,
        },
      },
    });

    if (isUser) {
      throw new ForbiddenException('Account already exists with this email');
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

    return cResponseData({
      data: accountantData,
      message: 'Accountant created successfully',
    });
  }

  async findAll() {
    const accountants = await this.Prisma.user.findMany({
      where: {
        role: 'ACCOUNTANT',
      },
      include: {
        profile: true,
        email: true,
      },
    });
    return cResponseData({
      data: accountants,
      message: 'Accountants fetched successfully',
    });
  }

  findOne(id: number) {
    return `This action returns a #${id} accountant`;
  }

  update(id: number, updateAccountantDto: UpdateAccountantDto) {
    return `This action updates a #${id} accountant`;
  }

  remove(id: number) {
    return `This action removes a #${id} accountant`;
  }
}
