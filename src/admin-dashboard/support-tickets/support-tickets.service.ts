import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { SupportTicketStatus } from 'prisma/generated/prisma/enums';
import { cResponseData } from 'src/common/cResponse';
import { PrismaService } from 'src/config/database/prisma.service';
import { CreateSupportTicketDto } from './dto/create-support-ticket.dto';
import { SupportTicketQueryDto } from './dto/support-ticket-query.dto';
// import { UpdateSupportTicketDto } from './dto/update-support-ticket.dto';
import { UpdateSupportTicketStatusDto } from './dto/update-support-ticket-status.dto';

@Injectable()
export class SupportTicketsService {
  constructor(private readonly prisma: PrismaService) {}

  private ticketInclude = {
    user: {
      select: {
        id: true,
        role: true,
        email: {
          select: {
            email: true,
          },
        },
        profile: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    },
  } as const;

  private formatTicketCode(ticketNumber: number) {
    return `TKT-${ticketNumber.toString().padStart(4, '0')}`;
  }

  async createTicket(userIdFromToken: string, dto: CreateSupportTicketDto) {
    try {
      const userExists = await this.prisma.user.findUnique({
        where: { id: userIdFromToken, isDeleted: false },
      });

      if (!userExists) {
        throw new NotFoundException('User not found');
      }

      const createdTicket = await this.prisma.supportTicket.create({
        data: {
          userId: userExists.id,
          subject: dto.subject,
          description: dto.description,
        },
      });

      const ticketCode = this.formatTicketCode(createdTicket.ticketNumber);

      const ticketWithCode = await this.prisma.supportTicket.update({
        where: { id: createdTicket.id },
        data: { ticketCode },
        include: this.ticketInclude,
      });

      return cResponseData({
        data: ticketWithCode,
        message: 'Support ticket created successfully',
      });
    } catch (error) {
      console.error(error);
      throw new BadRequestException('Failed to create support ticket');
    }
  }

  async getTicketData() {
    try {
      const [openTickets,inProgress,resolvedToday,lastSevenDay] = await Promise.all([
        this.prisma.supportTicket.count({
          where: {
            status:"OPEN"
          }
        }),
        this.prisma.supportTicket.count({
          where: {
            status:"IN_PROGRESS"
          }
        }),
        this.prisma.supportTicket.count({
          where: {
            status:"RESOLVED",
            resolvedAt:{
              gte:new Date(new Date().setHours(0,0,0,0))
            }
          }
        }),
        this.prisma.supportTicket.findMany({
          where: {
            createdAt:{
              gte: new Date(new Date().setDate(new Date().getDate()-7))
            },
            viewed:true
          }
        })
      ])

      const avgResponseTimeLastSevenDay = (() => {
        if (lastSevenDay.length === 0) return 0;

        const totalResponseMs = lastSevenDay.reduce((acc, ticket) => {
          const created = new Date(ticket.createdAt).getTime();
          const viewed = new Date(ticket.viewedAt as Date).getTime();
          const diff = viewed - created;
          return acc + (diff > 0 ? diff : 0);
        }, 0);

        const avgMs = totalResponseMs / lastSevenDay.length;
        return avgMs / (1000 * 60 * 60);
      })();
      
      return cResponseData({
        message: "Support data fetched",
        data: {
          openTickets, inProgress, resolvedToday, avgResponseTimeLastSevenDay
        }
      })


    } catch (error) {
      if (error instanceof HttpException) {
        throw error
      }
      throw new HttpException(
        'Failed to fetch support tickets stats',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getTickets(query: SupportTicketQueryDto) {
    try {
      const {
        status,
        priority,
        search,
        userId,
        from,
        to,
        page = 1,
        limit = 10,
      } = query;
      const where: any = {};

      if (status) where.status = status;
      if (priority) where.priority = priority;
      if (userId) where.userId = userId;

      if (search) {
        where.OR = [
          { ticketCode: { contains: search, mode: 'insensitive' } },
          { subject: { contains: search, mode: 'insensitive' } },
        ];
      }

      if (from || to) {
        where.createdAt = {};
        if (from) where.createdAt.gte = new Date(from);
        if (to) where.createdAt.lte = new Date(to);
      }

      const [tickets, total] = await Promise.all([
        this.prisma.supportTicket.findMany({
          where,
          include: this.ticketInclude,
          orderBy: { createdAt: 'desc' },
          skip: (page - 1) * limit,
          take: limit,
        }),
        this.prisma.supportTicket.count({ where }),
      ]);

  
      return {
        ...cResponseData({
          data: tickets,
          message: 'Support tickets fetched successfully',
        }),
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      };
    } catch (error) {
      console.error('Get tickets error:', error);
      if (error instanceof HttpException) throw error;
      throw new HttpException(
        'Failed to fetch support tickets',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getTicketById(id: string) {
    try {
      const ticket = await this.prisma.supportTicket.findUnique({
        where: { id },
        include: this.ticketInclude,
      });

      if (!ticket) {
        throw new NotFoundException('Support ticket not found');
      }

      return cResponseData({
        data: ticket,
        message: 'Support ticket fetched successfully',
      });
    } catch (error) {
      console.error(error);
      throw new BadRequestException('Failed to fetch support ticket');
    }
  }

  // async updateTicket(id: string, dto: UpdateSupportTicketDto) {
  //   try {
  //     const ticket = await this.prisma.supportTicket.findUnique({
  //       where: { id },
  //     });

  //     if (!ticket) {
  //       throw new NotFoundException('Support ticket not found');
  //     }

  //     const updated = await this.prisma.supportTicket.update({
  //       where: { id },
  //       data: {
  //         subject: dto.subject ?? ticket.subject,
  //         description: dto.description ?? ticket.description,
  //         priority: dto.priority ?? ticket.priority,
  //       },
  //       include: this.ticketInclude,
  //     });

  //     return cResponseData({
  //       data: updated,
  //       message: 'Support ticket updated successfully',
  //     });
  //   } catch (error) {
  //     console.error(error);
  //     throw new BadRequestException('Failed to update support ticket');
  //   }
  // }

  async updateStatus(id: string, dto: UpdateSupportTicketStatusDto) {
    try {
      const ticket = await this.prisma.supportTicket.findUnique({
        where: { id },
      });

      if (!ticket) {
        throw new NotFoundException('Support ticket not found');
      }

      const resolveStatus = new Set<SupportTicketStatus>([
        SupportTicketStatus.RESOLVED,
        SupportTicketStatus.CLOSED,
      ]);

      const updated = await this.prisma.supportTicket.update({
        where: { id },
        data: {
          status: dto.status,
          priority: dto.priority ?? ticket.priority,
          resolvedAt: resolveStatus.has(dto.status) ? new Date() : null,
        },
        include: this.ticketInclude,
      });

      return cResponseData({
        data: updated,
        message: 'Support ticket status updated successfully',
      });
    } catch (error) {
      console.error(error);
      throw new BadRequestException('Failed to update support ticket status');
    }
  }

  async markAsView(ticketId:string) {
    try {
      const haveTicket = await this.prisma.supportTicket.findUnique({
        where: {
          id:ticketId
        }
      })

      if (!haveTicket) {
        throw new NotFoundException('Support ticket not found')
      }

      const updatedTicket = await this.prisma.supportTicket.update({
        where: {
          id:ticketId
        },
        data: {
          viewedAt: new Date(),
          viewed:true
        }
      })

      return cResponseData({
        data:updatedTicket,
        message:'Mark as view success'
      })
    } catch (error) {
      if (error instanceof HttpException || error instanceof NotFoundException) {
        throw error
      }
      throw new HttpException('Mark as view false',HttpStatus.INTERNAL_SERVER_ERROR)
    }
  }
}
