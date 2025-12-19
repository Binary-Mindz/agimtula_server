import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { CustomUserService } from './custom-user.service';
import { CreateCustomUserDto } from './dto/create-custom-user.dto';
import { UpdateCustomUserDto } from './dto/update-custom-user.dto';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { ApiQuery } from '@nestjs/swagger';

@Controller('custom-user')
export class CustomUserController {
  constructor(private readonly customUserService: CustomUserService) {}

  @Post()
  @Roles('ADMIN')
  async create(@Body() createCustomUserDto: CreateCustomUserDto) {
    return await this.customUserService.create(createCustomUserDto);
  }

  @Get()
  @Roles('ADMIN')
  @ApiQuery({ name: 'search', required: false, type: 'string' })
  @ApiQuery({ name: 'status', required: false, type: 'string' })
  @ApiQuery({ name: 'plan', required: false, type: 'string' })
  findAll(
    @Query('search') search: string,
    @Query('status') status: string,
    @Query('plan') plan: string,
  ) {
    return this.customUserService.findAll(search, status, plan);
  }

  @Patch(':id')
  @Roles('ADMIN')
  update(
    @Param('id') id: string,
    @Body() updateCustomUserDto: UpdateCustomUserDto,
  ) {
    return this.customUserService.update(id, updateCustomUserDto);
  }

  @Delete(':id')
  @Roles('ADMIN')
  async remove(@Param('id') id: string) {
    return await this.customUserService.remove(id);
  }
}
