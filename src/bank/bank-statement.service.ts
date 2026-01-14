import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { MT940Parser, MT940Result } from './parsers/mt940.parser';
import { CAMT053Parser, CAMT053Result } from './parsers/camt053.parser';

@Injectable()
export class BankStatementService {
  private readonly logger = new Logger(BankStatementService.name);

  constructor(
    private readonly mt940Parser: MT940Parser,
    private readonly camt053Parser: CAMT053Parser,
  ) {
    this.logger.log('BankStatementService initialized');
  }

  async processFile(file: Express.Multer.File, fileExtension: string): Promise<MT940Result | CAMT053Result> {
    try {
      this.logger.log(`Starting file processing - Type: ${fileExtension.toUpperCase()}, Size: ${file.size} bytes, Name: ${file.originalname}`);

      if (!file || !file.buffer) {
        this.logger.error('Invalid file - No buffer found');
        throw new BadRequestException('Invalid file uploaded');
      }

      if (file.size === 0) {
        this.logger.warn('Empty file uploaded');
        throw new BadRequestException('File is empty');
      }

      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        this.logger.warn(`File too large: ${file.size} bytes`);
        throw new BadRequestException('File size exceeds 10MB limit');
      }

      const content = file.buffer.toString('utf-8');
      this.logger.debug(`File content length: ${content.length} characters`);

      if (!content || content.trim().length === 0) {
        this.logger.error('File content is empty after parsing');
        throw new BadRequestException('File content is empty');
      }

      let result: MT940Result | CAMT053Result;

      if (fileExtension === '940') {
        this.logger.log('Processing MT940 format file');
        result = this.mt940Parser.parseMT940(content);
        this.logger.log(`MT940 parsing successful - Transactions: ${result.transactions?.length || 0}`);
      } else if (fileExtension === 'xml') {
        this.logger.log('Processing CAMT053 XML format file');
        result = this.camt053Parser.parseCAMT053(content);
        this.logger.log(`CAMT053 parsing successful - Transactions: ${result.transactions?.length || 0}`);
      } else {
        this.logger.error(`Unsupported file format: ${fileExtension}`);
        throw new BadRequestException(`Unsupported file format: ${fileExtension}. Only .940 and .xml files are supported`);
      }

      this.logger.log(`File processing completed successfully - Format: ${fileExtension.toUpperCase()}, Transactions: ${result.transactions?.length || 0}`);
      return result;

    } catch (error) {
      this.logger.error(`File processing failed - Type: ${fileExtension}, Error: ${error.message}`, error.stack);

      if (error instanceof BadRequestException) {
        throw error;
      }

      throw new BadRequestException(`Failed to process ${fileExtension.toUpperCase()} file: ${error.message}`);
    }
  }

  async validateFileFormat(file: Express.Multer.File, expectedExtension: string): Promise<boolean> {
    try {
      this.logger.log(`Validating file format - Expected: ${expectedExtension}, File: ${file.originalname}`);

      const fileExtension = file.originalname.split('.').pop()?.toLowerCase();

      if (!fileExtension) {
        this.logger.warn(`No file extension found in: ${file.originalname}`);
        return false;
      }

      const isValid = fileExtension === expectedExtension.replace('.', '').toLowerCase();

      if (isValid) {
        this.logger.log(`File format validation successful: ${file.originalname}`);
      } else {
        this.logger.warn(`File format validation failed - Expected: ${expectedExtension}, Got: ${fileExtension}`);
      }

      return isValid;

    } catch (error) {
      this.logger.error(`File format validation error: ${error.message}`, error.stack);
      return false;
    }
  }

  async getFileStats(file: Express.Multer.File): Promise<{
    size: number;
    mimeType: string;
    originalName: string;
    encoding: string;
  }> {
    try {
      this.logger.debug(`Getting file stats for: ${file.originalname}`);

      const stats = {
        size: file.size,
        mimeType: file.mimetype,
        originalName: file.originalname,
        encoding: file.encoding,
      };

      this.logger.debug(`File stats retrieved: ${JSON.stringify(stats)}`);
      return stats;

    } catch (error) {
      this.logger.error(`Failed to get file stats: ${error.message}`, error.stack);
      throw new BadRequestException('Failed to retrieve file information');
    }
  }
}
