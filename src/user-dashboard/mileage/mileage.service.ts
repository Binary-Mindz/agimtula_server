import { Injectable } from '@nestjs/common';
import { LogTripDto } from './dto/log-trip.dto';
import { PrismaService } from 'src/config/database/prisma.service';
import { cResponseData } from 'src/common/cResponse';

@Injectable()
export class MileageService {
  constructor(private prisma: PrismaService) {}

  async logTrip(userId: string, dto: LogTripDto) {
    const trip = await this.prisma.mileage.create({
      data: {
        date: dto.date,
        startLocation: dto.startLocation,
        endLocation: dto.endLocation,
        distance: dto.distance,
        tripType: dto.tripType,
        vehicle: dto.vehicle,
        amount: dto.distance * 0.6,
        purpose: dto.purpose,
        notes: dto.notes,
        userId: userId,
      },
    });

    return cResponseData({
      message: 'Trip logged successfully',
      data:  trip ,
    });
  }

  async getMileageTrack(userId: string) {
    const firstDayThisMonth = new Date(
      new Date().getFullYear(),
      new Date().getMonth(),
      1,
    );
    const lastDayThisMonth = new Date(
      new Date().getFullYear(),
      new Date().getMonth() + 1,
      0,
      23,
      59,
      59,
    );
    const [totalDistance, reimbursement, totalTripLastMonth, trips] =
      await Promise.all([
        this.prisma.mileage.aggregate({
          where: { userId },
          _sum: { distance: true },
        }),

        this.prisma.mileage.aggregate({
          where: { userId },
          _sum: { amount: true },
        }),

        this.prisma.mileage.count({
          where: {
            userId,
            date: {
              gte: firstDayThisMonth,
              lte: lastDayThisMonth,
            },
          },
        }),

        this.prisma.mileage.findMany({
          where: { userId },
          select: {
            id: true,
            startLocation: true,
            endLocation: true,
            date: true,
            distance: true,
            amount: true,
          },
          orderBy: { date: 'desc' },
        }),
      ]);

    return cResponseData({
      message: 'Mileage data retrieved successfully',
      data: {
        totalDistance: totalDistance._sum.distance || 0,
        totalTripThisMonth: totalTripLastMonth || 0,
        reimbursement: reimbursement._sum.amount || 0,
        trips,
      },
    });
  }

  async editLoggedTrip(userId: string, tripId: string, dto: LogTripDto) {
    const updatedTrip = await this.prisma.mileage.update({
      where: { userId, id: tripId },
      data: {
        date: dto.date,
        startLocation: dto.startLocation,
        endLocation: dto.endLocation,
        distance: dto.distance,
        tripType: dto.tripType,
        vehicle: dto.vehicle,
        amount: dto.distance * 0.6,
        purpose: dto.purpose,
        notes: dto.notes,
      },
    });
    return cResponseData({
      message: 'Trip updated successfully',
     data: updatedTrip,
    });
  }

  async deleteLoggedTrip(userId: string, tripId: string) {
    await this.prisma.mileage.delete({
      where: { userId, id: tripId },
    });
    return {
      message: 'Trip deleted successfully',
    };
  }
}
