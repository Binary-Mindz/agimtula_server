import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { LogTripDto } from './dto/log-trip.dto';
import { PrismaService } from 'src/config/database/prisma.service';
import { cResponseData } from 'src/common/cResponse';

@Injectable()
export class MileageService {
  constructor(private prisma: PrismaService) { }

  async logTrip(userId: string, dto: LogTripDto) {
    try {
      const userExists = await this.prisma.user.findUnique({
        where: { id: userId, isDeleted: false },
      });

      if (!userExists) {
        throw new HttpException('User not found', HttpStatus.NOT_FOUND);
      }



      const trip = await this.prisma.mileage.create({
        data: {
          name: dto.name,
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
        success: true,
        message: 'Trip logged successfully',
        data: trip,
      });
    } catch (error) {
      console.error('Log trip error:', error);
      throw new HttpException(
        'Failed to log trip',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getMileageTrack(userId: string, page: number = 1, limit: number = 10) {
    try {
      const skip = (page - 1) * limit;
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
      const [
        totalDistance,
        reimbursement,
        totalTripLastMonth,
        trips,
        totalTrips,
      ] = await Promise.all([
        this.prisma.mileage.aggregate({
          where: { userId, user: { isDeleted: false } },
          _sum: { distance: true },
        }),

        this.prisma.mileage.aggregate({
          where: { userId, user: { isDeleted: false } },
          _sum: { amount: true },
        }),

        this.prisma.mileage.count({
          where: {
            userId,
            user: { isDeleted: false },
            date: {
              gte: firstDayThisMonth,
              lte: lastDayThisMonth,
            },
          },
        }),

        this.prisma.mileage.findMany({
          where: { userId, user: { isDeleted: false } },
          select: {
            id: true,
            startLocation: true,
            endLocation: true,
            date: true,
            distance: true,
            amount: true,
            milage_id: true,
          },
          orderBy: { date: 'desc' },
          skip,
          take: limit,
        }),
        this.prisma.mileage.count({ where: { userId, user: { isDeleted: false } } }),
      ]);

      const totalPages = Math.ceil(totalTrips / limit);

      return cResponseData({
        success: true,
        message: 'Mileage data retrieved successfully',
        data: {
          totalDistance: totalDistance._sum.distance || 0,
          totalTripThisMonth: totalTripLastMonth || 0,
          reimbursement: reimbursement._sum.amount || 0,
          trips,
          pagination: {
            currentPage: page,
            totalPages,
            totalRecords: totalTrips,
            limit,
            hasNext: page < totalPages,
            hasPrev: page > 1,
          },
        },
      });
    } catch (error) {
      console.error('Get mileage track error:', error);
      throw new HttpException(
        'Failed to retrieve mileage data',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async editLoggedTrip(userId: string, tripId: string, dto: LogTripDto) {
    try {

      const userExists = await this.prisma.user.findUnique({
        where: { id: userId, isDeleted: false },
      });

      if (!userExists) {
        throw new HttpException('User not found', HttpStatus.NOT_FOUND);
      }
      const tripExists = await this.prisma.mileage.findUnique({
        where: { id: tripId, userId, user: { isDeleted: false } },
      });

      if (!tripExists) {
        throw new HttpException('Trip not found', HttpStatus.NOT_FOUND);
      }


      const updatedTrip = await this.prisma.mileage.update({
        where: {
          userId,
          id: tripId,
          user: { isDeleted: false },
        },
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
        success: true,
        message: 'Trip updated successfully',
        data: updatedTrip,
      });
    } catch (error) {
      console.error('Edit trip error:', error);
      throw new HttpException(
        'Failed to update trip',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async deleteLoggedTrip(userId: string, tripId: string) {
    try {
      const userExists = await this.prisma.user.findUnique({
        where: { id: userId, isDeleted: false },
      });

      if (!userExists) {
        throw new HttpException('User not found', HttpStatus.NOT_FOUND);
      }
      const tripExists = await this.prisma.mileage.findUnique({
        where: { id: tripId, userId, user: { isDeleted: false } },
      });

      if (!tripExists) {
        throw new HttpException('Trip not found', HttpStatus.NOT_FOUND);
      }
      const deletedTrip = await this.prisma.mileage.delete({
        where: {
          userId,
          id: tripId,
          user: { isDeleted: false },
        },
      });

      return cResponseData({
        success: true,
        message: 'Trip deleted successfully',
        data: deletedTrip,
      });
    } catch (error) {
      console.error('Delete trip error:', error);
      throw new HttpException(
        'Failed to delete trip',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
