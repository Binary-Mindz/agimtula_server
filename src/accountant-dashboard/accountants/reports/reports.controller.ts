import { Controller, Get, Param } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { Roles } from 'src/decorators/roles.decorator';
import { ApiParam } from '@nestjs/swagger';
import { User } from 'src/decorators/user.decorator';
import { jwtPayload } from 'src/auth/types/jwt-payload';

@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) { }
  
  @Get("sales-report/:userId")
  @Roles("ACCOUNTANT")
  @ApiParam({
    name: "userId",
    type:String,
    required:true
    })
  async salesReport(@User() user: jwtPayload, @Param('userId') userId:string) {
    return await this.reportsService.salesReports(userId, user.sub)
  }

  @Get("purchase-report/:userId")
  @Roles("ACCOUNTANT")
  @ApiParam({
    name: "userId",
    type:String,
    required:true
    })
  async purchaseReport(@User() user: jwtPayload, @Param('userId') userId:string) {
    return await this.reportsService.purchaseReports(userId, user.sub)
  }

  @Get('vat-summurry/:userId')
  @Roles('ACCOUNTANT')
  @ApiParam({
    name: 'userId',
    type: String,
    required: true
  })
  async vatSummarry(@User() user: jwtPayload, @Param('userId') userId: string) {
    return await this.reportsService.vatSummarry(userId, user.sub);
  }

  @Get("client-overview/:userId")
  @Roles("ACCOUNTANT")
  @ApiParam({
    name: "userId",
    type:String,
    required:true
  })
  async clientOverview(@User() user: jwtPayload, @Param('userId') userId:string) {
    return await this.reportsService.clientOverview(userId, user.sub)
  }
}
