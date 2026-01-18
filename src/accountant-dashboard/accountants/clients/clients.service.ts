import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { formatDistanceToNow } from 'date-fns';
import { cResponseData } from 'src/common/cResponse';
import { PrismaService } from 'src/config/database/prisma.service';

@Injectable()
export class ClientsService {
  constructor(private readonly prisma: PrismaService) {}


  async clientsData(accountantId: string) {
    try {
      const clients = await  this.prisma.user.findMany({
          where: {
            accountantId: accountantId,
            isDeleted:false,
          }
        })
        

      let workloadCount = 0;
      let missingDocs = 0;
      let activeUserCount = 0;
      await Promise.all(clients.map(async client => {
        const haveWorkload = await this.prisma.invoice.count({
          where: {
            previewedByAccountant: false,
            invoiceSource: "EMAIL"
          }
        })

        if (haveWorkload >0) {
          workloadCount +=1
        }

        const docsCount = await this.prisma.invoice.count({
          where: {
            invoiceSource:"EMAIL",
            haveAttachment: false,
          }
        })
        
        if (docsCount) {
          missingDocs += docsCount;
        }

        const activity = await this.prisma.activityLog.findFirst({
          where: {
            userId: client.id,
            createdAt: {
              gte: new Date(new Date().setDate(new Date().getDate() - 7)),
            }
            
          }
          ,orderBy:{createdAt:"desc"}
        })

        if (activity) {
          activeUserCount+= 1
        }
      }));


      const data = {
        totalClient :clients.length,
        workloadCount,
        missingDocs,
        activeUserCount,
      }

      return cResponseData({
        success: true,
        message: 'Clients data fetched successfully',
        data: data,
      });

    } catch (error) {
      if (error instanceof HttpException) {
        throw error
      }
    throw new HttpException(
        'Failed to fetch clients data',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }


  async clients(accountantId: string, search?: string) {
    try {
      if (!accountantId) {
        throw new HttpException('Accountant ID is required', HttpStatus.BAD_REQUEST);
      }

      const whereClause: any = {
        accountantId,
      };

      if (search) {
        whereClause.OR = [
          {
            profile: {
              firstName: {
                contains: search,
                mode: 'insensitive',
              },
            },
          },
          {
            profile: {
              lastName: {
                contains: search,
                mode: 'insensitive',
              },
            },
          },
          {
            email: {
              email: {
                contains: search,
                mode: 'insensitive',
              },
            },
          },
          {
            businessInfo: {
              companyName: {
                contains: search,
                mode: 'insensitive',
              },
            },
          },
          {
            businessInfo: {
              vatNumber: {
                contains: search,
                mode: 'insensitive',
              },
            },
          },
        ];
      }

      const clients = await this.prisma.user.findMany({
        where: whereClause,
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
          status:true
        },
      });

      const data = await Promise.all(clients.map(async client => {
        
        const lastActivity = await this.prisma.activityLog.findFirst({
          where: {
            category: "USER",
            userId:client.id
          },
          orderBy: {
            createdAt:"desc"
          }
        })

        const invoice = await this.prisma.invoice.count({
          where:{
            userId: client.id,
            previewedByAccountant: false,
            invoiceSource: "EMAIL"
          }
        })

        return {
          name: `${client.profile?.firstName} ${client.profile?.lastName}`,
          companyName: client.businessInfo?.companyName,
          vatNumber: client.businessInfo?.vatNumber,
          lastActivity:formatDistanceToNow(new Date(lastActivity?.createdAt  as Date), {
              addSuffix: true,
            }),
          id: client.id,
          pendingItems: invoice,
          status: client.status
          
         }
      }));

      return cResponseData({
        success: true,
        message: 'Clients fetched successfully',
        data: data,
      });
    } catch (error) {
       if (error instanceof HttpException) {
        throw error
      }
      throw new HttpException(
        'Failed to fetch clients',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
