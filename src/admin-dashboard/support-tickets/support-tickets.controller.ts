import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { Roles } from 'src/decorators/roles.decorator';
import { CreateSupportTicketDto } from './dto/create-support-ticket.dto';
import { SupportTicketQueryDto } from './dto/support-ticket-query.dto';
import { UpdateSupportTicketStatusDto } from './dto/update-support-ticket-status.dto';
// import { UpdateSupportTicketDto } from './dto/update-support-ticket.dto';
import { SupportTicketsService } from './support-tickets.service';
import { jwtPayload } from 'src/auth/types/jwt-payload';
import { User } from 'src/decorators/user.decorator';

@ApiTags('Support Tickets')
@Controller('support-tickets')
export class SupportTicketsController {
  constructor(private readonly supportTicketsService: SupportTicketsService) {}

  @Post()
  @Roles('ADMIN', 'USER', 'ACCOUNTANT')
  @ApiOperation({ summary: 'Create a new support ticket' })
  async create(@User() user: jwtPayload, @Body() dto: CreateSupportTicketDto) {
    return await this.supportTicketsService.createTicket(user.sub, dto);
  }

  @Get('ticket-data')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Get ticket data (ADMIN only)' })
  async getTicketData() {
    return await this.supportTicketsService.getTicketData();
  }

  @Get()
  @Roles('ADMIN')
  @ApiOperation({ summary: 'List support tickets (ADMIN only)' })
  async findAll(@Query() query: SupportTicketQueryDto) {
    return await this.supportTicketsService.getTickets(query);
  }

  @Get(':id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Get a support ticket by ID (ADMIN only)' })
  @ApiParam({ name: 'id', required: true })
  async findOne(@Param('id') id: string) {
    return await this.supportTicketsService.getTicketById(id);
  }

  // @Patch(':id')
  // @Roles('ADMIN')
  // @ApiOperation({ summary: 'Update ticket details (ADMIN only)' })
  // @ApiParam({ name: 'id', required: true })
  // async updateTicket(@Param('id') id: string, @Body() dto: UpdateSupportTicketDto) {
  //   return await this.supportTicketsService.updateTicket(id, dto);
  // }

  @Patch(':id/status')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Update ticket status (ADMIN only)' })
  @ApiParam({ name: 'id', required: true })
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateSupportTicketStatusDto,
  ) {
    return await this.supportTicketsService.updateStatus(id, dto);
  }

  @Patch('mark-as-view/:id')
  @Roles('ADMIN')
    @ApiParam({ name: 'id', required: true })
  @ApiOperation({ summary: 'Mark ticket as view (ADMIN only)' })
  async markAsView(@Param('id') ticketId:string) {
    return await this.supportTicketsService.markAsView(ticketId);
  }
}
