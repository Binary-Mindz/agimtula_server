/* eslint-disable @typescript-eslint/no-unused-vars */
import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/config/database/prisma.service';
import { RequestAccountant } from './dto/request-accountant.dto';
import { cResponseData } from 'src/common/cResponse';

@Injectable()
export class RequesteAccountantService {
  constructor(private Prisma: PrismaService) {}

  async requestAccountant(userId: string, dto: RequestAccountant) {
    try {
      const user = await this.Prisma.user.findUnique({
        where: {
          id: userId,
        },
      });

      if (user?.haveAccountant) {
        throw new ForbiddenException('You already have an accountant');
      }

      const request = await this.Prisma.accountantRequest.create({
        data: {
          userId,
          ...dto,
        },
      });

      return cResponseData({
        message: 'Request sent successfully',
        data: request,
      });
    } catch (error) {
      return cResponseData({
        message: 'Failed to send request',
        error: 'Failed to send request',
      });
    }
  }
}
