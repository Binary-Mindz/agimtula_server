import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from 'src/config/database/prisma.service';
import { RequestAccountant } from './dto/request-accountant.dto';
import { cResponseData } from 'src/common/cResponse';
import { ConflictAppException } from 'src/common/app-exceptions';

@Injectable()
export class RequestAccountantService {
  constructor(private Prisma: PrismaService) {}

  async requestAccountant(userId: string, dto: RequestAccountant) {
    try {
      const user = await this.Prisma.user.findUnique({
        where: {
          id: userId,
        },
      });

      if (user?.haveAccountant) {
        throw new ConflictAppException('You already have an accountant');
      }

      const request = await this.Prisma.accountantRequest.create({
        data: {
          userId,
          ...dto,
        },
      });

      return cResponseData({
        success: true,
        message: 'Request sent successfully',
        data: request,
      });
    } catch (error) {
      if (error instanceof ConflictAppException) {
        throw error;
      }
      console.error('Request accountant error:', error);
      throw new HttpException(
        'Failed to send request',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
