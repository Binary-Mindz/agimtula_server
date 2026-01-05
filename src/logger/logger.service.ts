import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from 'src/config/database/prisma.service';
import { QueryLoggerDto } from './dto/logquery.dto';
import { cResponseData } from 'src/common/cResponse';

@Injectable()
export class LoggerService {
  constructor(private readonly prisma: PrismaService) { }


  async findAll(queryDto: QueryLoggerDto) {
    try {
      const { level, logpriority: priority, page = 1, limit = 10 } = queryDto;

      const where: any = {};

      if (level) {
        where.level = level;
      }

      if (priority) {
        where.logpriority = priority;
      }

      // Calculate pagination
      const skip = (page - 1) * limit;
      const take = limit;

      // Get total count
      const total = await this.prisma.loggers.count({ where });

      // Get paginated data
      const data = await this.prisma.loggers.findMany({
        where,
        skip,
        take,
        orderBy: {
          timestamp: 'desc',
        },
      });

      // Calculate meta information
      const totalPages = Math.ceil(total / limit);
      const hasNextPage = page < totalPages;
      const hasPreviousPage = page > 1;
      const res = {
        data,
        meta: {
          total,
          page,
          limit,
          totalPages,
          hasNextPage,
          hasPreviousPage,
        },
      };
      return cResponseData(res);
    } catch (error) {
      console.error(error.message);
      throw new InternalServerErrorException('Failed to fetch logs all data');
    }
  }
}
