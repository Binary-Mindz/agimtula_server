import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { cResponseData } from 'src/common/cResponse';
import { PrismaService } from 'src/config/database/prisma.service';

@Injectable()
export class ClientsService {
  constructor(private readonly prisma: PrismaService) {}

  async clients( accountantId: string) {
    try {
      if (!accountantId) {
        throw new HttpException('Accountant ID is required', HttpStatus.BAD_REQUEST);
      }

      const clients = await this.prisma.user.findMany({
        where: {
          accountantId,
        },
        select: {
          id: true,
          profile: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
          businessInfo: {
            select: {
              companyName: true,
              vatNumber: true,
            },
          },
        },
      });

      const clientData = clients.map((client) => ({
        name: `${client.profile?.firstName} ${client.profile?.lastName}`,
        companyName: client.businessInfo?.companyName,
        vatNumber: client.businessInfo?.vatNumber,
        id: client.id,
      }));

      return cResponseData({
        success: true,
        message: 'Clients fetched successfully',
        data: clientData,
      });
    } catch (error) {
      console.error('Fetch clients error:', error);
      throw new HttpException(
        'Failed to fetch clients',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
