import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { LoggerService } from './logger.service';

@Controller('logger')
export class LoggerController {
  constructor(private readonly loggerService: LoggerService) { }

  @Post()
  async create(@Body() createLoggerDto) {
    return await this.loggerService.create(createLoggerDto);
  }

  @Get()
  async findAll() {
    return await this.loggerService.findAll();
  }






}
