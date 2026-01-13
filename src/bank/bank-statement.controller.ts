import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiConsumes, ApiBody, ApiOperation } from '@nestjs/swagger';
import { BankStatementService } from './bank-statement.service';
import { UploadBankStatementDto } from './dto/upload-bank-statement.dto';
import { Roles } from 'src/decorators/roles.decorator';
import { UserRole } from 'prisma/generated/prisma/enums';

@ApiTags('Bank Statement Upload')
@Controller('bank-statement')
export class BankStatementController {
  private readonly logger = new Logger(BankStatementController.name);
  constructor(private readonly bankStatementService: BankStatementService) { }


  @Post('upload')
  @Roles(UserRole.USER)
  @ApiOperation({ summary: 'Upload bank statement file ( USER )' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Bank statement file',
    type: UploadBankStatementDto,
  })
  @UseInterceptors(FileInterceptor('file'))


  async uploadBankStatement(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    this.logger.log(`Received file: ${file.originalname} (${file.mimetype})`);

    const fileExtension = file.originalname.split('.').pop()?.toLowerCase();

    if (!fileExtension || !['940', 'xml'].includes(fileExtension)) {
      throw new BadRequestException(
        'Invalid file format. Only .940 (MT940) and .xml (CAMT.053) files are supported.',
      );
    }

    try {
      const result = await this.bankStatementService.processFile(file, fileExtension);
      return {
        success: true,
        message: 'File processed successfully',
        fileType: fileExtension === '940' ? 'MT940' : 'CAMT.053',
        data: result,
      };
    } catch (error) {
      this.logger.error(`Error processing file: ${error.message}`);
      throw new BadRequestException(`Failed to process file: ${error.message}`);
    }
  }






}
