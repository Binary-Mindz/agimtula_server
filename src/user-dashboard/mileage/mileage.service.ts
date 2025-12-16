import { Injectable } from '@nestjs/common';
import { LogTripDto } from './dto/log-trip.dto';
import { PrismaService } from 'src/config/database/prisma.service';

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
        purpose: dto.purpose,
        notes: dto.notes,
        userId: userId,
      },
    });

    return {
      message: 'Trip logged successfully',
      trip,
    };
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
    const [totalDistance, totalTripLastMonth] = await Promise.all([
      this.prisma.mileage.aggregate({
        where: { userId },
        _sum: { distance: true },
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
    ]);

    const reimbursement: number = totalDistance._sum.distance
      ? totalDistance._sum.distance * 0.6
      : 0;

    return {
      message: 'Mileage data retrieved successfully',
      data: {
        totalDistance: totalDistance._sum.distance || 0,
        totalTripThisMonth: totalTripLastMonth || 0,
        reimbursement: parseFloat(reimbursement.toFixed(2)),
      },
    };
  }
}
