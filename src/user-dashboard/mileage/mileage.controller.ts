import {
  Controller,
  Post,
  Body,
  Get,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { MileageService } from './mileage.service';
import { LogTripDto } from './dto/log-trip.dto';
import { Roles } from 'src/decorators/roles.decorator';
import { jwtPayload } from 'src/auth/types/jwt-payload';
import { User } from 'src/decorators/user.decorator';
import { ApiOperation, ApiParam, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { urlPrefix } from '../url-prefix';

@Controller(`${urlPrefix}mileage`)
export class UserMileageController {
  constructor(private readonly mileageService: MileageService) { }

  @Post('log-trip')
  @Roles('USER')
  @ApiOperation({ summary: 'Log new trip ( USER only )' })
  @ApiResponse({ status: 201, description: 'Trip logged successfully' })
  @ApiResponse({ status: 400, description: 'Invalid trip data' })
  async logTrip(@Body() dto: LogTripDto, @User() user: jwtPayload) {
    return await this.mileageService.logTrip(user.sub, dto);
  }

  @Get('mileage-track')
  @Roles('USER')
  @ApiQuery({ name: 'page', required: false, type: 'number', description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: 'number', description: 'Items per page (default: 10)' })
  @ApiOperation({ summary: 'Get mileage track with pagination ( USER only )' })
  @ApiResponse({
    status: 200,
    description: 'Mileage track retrieved successfully with pagination',
    schema: {
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
        data: {
          type: 'object',
          properties: {
            totalDistance: { type: 'number' },
            totalTripThisMonth: { type: 'number' },
            reimbursement: { type: 'number' },
            trips: { type: 'array' },
            pagination: {
              type: 'object',
              properties: {
                currentPage: { type: 'number' },
                totalPages: { type: 'number' },
                totalRecords: { type: 'number' },
                limit: { type: 'number' },
                hasNext: { type: 'boolean' },
                hasPrev: { type: 'boolean' },
              },
            },
          },
        },
      },
    },
  })
  async getMileageTrack(
    @User() user: jwtPayload,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return await this.mileageService.getMileageTrack(user.sub, page || 1, limit || 10);
  }

  @Patch('edit-trip/:id')
  @Roles('USER')
  @ApiOperation({ summary: 'Edit trip ( USER only )' })
  @ApiParam({ name: 'id', type: 'string' })
  @ApiResponse({ status: 200, description: 'Trip updated successfully' })
  @ApiResponse({ status: 404, description: 'Trip not found' })
  async editTrip(
    @Body() dto: LogTripDto,
    @User() user: jwtPayload,
    @Param('id') tripId: string,
  ) {
    return await this.mileageService.editLoggedTrip(user.sub, tripId, dto);
  }

  @Delete('delete-trip/:id')
  @Roles('USER')
  @ApiOperation({ summary: 'Delete trip ( USER only )' })
  @ApiParam({ name: 'id', type: 'string' })
  @ApiResponse({ status: 204, description: 'Trip deleted successfully' })
  @ApiResponse({ status: 404, description: 'Trip not found' })
  async deleteTrip(@User() user: jwtPayload, @Param('id') tripId: string) {
    return await this.mileageService.deleteLoggedTrip(user.sub, tripId);
  }
}
