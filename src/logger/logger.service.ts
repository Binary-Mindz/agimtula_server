import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from 'src/config/database/prisma.service';

@Injectable()
export class LoggerService {
  constructor(private readonly prisma: PrismaService) { }
  async create(createLoggerDto: any) {
    try {

      const response = await this.prisma.client.loggers.create({
        data: createLoggerDto,
      });
      return response;
    } catch (error) {
      const errMsg = 'Error creating logger: ' + error.message;
      console.log(errMsg);
      throw new InternalServerErrorException('Something went wrong while creating logger. ');
    }
  }

  async findAll() {
    return `This action returns all logger`;
  }

  async findOne(id: number) {
    return `This action returns a #${id} logger`;
  }



  async remove(id: number) {
    return `This action removes a #${id} logger`;
  }
}
