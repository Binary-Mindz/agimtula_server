import { Controller, Get, Body, Query, UseGuards } from '@nestjs/common';
import { LoggerService } from './logger.service';
import { ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { QueryLoggerDto } from './dto/logquery.dto';
import { AuthGuard } from 'src/auth/guard/auth.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';

@Controller('logger')

export class LoggerController {
  constructor(private readonly loggerService: LoggerService) { }
  @Get()
  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Get all logs ( ADMIN only )' })
  @ApiResponse({ status: 200, description: 'Logs fetched successfully' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async findAll(@Query() queryDto: QueryLoggerDto) {
    return await this.loggerService.findAll(queryDto);
  }
}
