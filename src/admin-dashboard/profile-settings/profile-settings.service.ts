import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/config/database/prisma.service';
import { ProfileSettingsDto } from './dto/profile-setting.dto';

@Injectable()
export class ProfileSettingsService {
  constructor(private readonly prisma: PrismaService) {}

  async adminEditProfileSetting(dto: ProfileSettingsDto, userId: string) {
    try {
      const updatedData = await this.prisma.user.update({
        where: {
          id: userId,
        },
        data: {
          profile: {
            update: {
              firstName: dto.firstName,
              lastName: dto.lastName,
            },
          },
          email: {
            update: {
              email: dto.email,
            },
          },
          businessInfo: {
            update: {
              companyName: dto.businessName,
              vatNumber: dto.vatNumber,
            },
          },
        },
        select: {
          profile: true,
          email: true,
          businessInfo: true,
        },
      });

      return {
        success: true,
        message: 'Admin details updated successfully',
        data: {
          firstName: updatedData.profile?.firstName,
          lastName: updatedData.profile?.lastName,
          email: updatedData.email?.email,
          businessName: updatedData.businessInfo?.companyName,
          vatNumber: updatedData.businessInfo?.vatNumber,
        },
      };
    } catch (error) {
      console.error(error);
      throw new HttpException(
        'failed to edit admin details',
        HttpStatus.BAD_REQUEST,
      );
    }
  }
}
