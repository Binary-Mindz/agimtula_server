import { Injectable, Logger } from '@nestjs/common';
import { MT940Parser, MT940Result } from './parsers/mt940.parser';
import { CAMT053Parser, CAMT053Result } from './parsers/camt053.parser';

@Injectable()
export class BankStatementService {
  private readonly logger = new Logger(BankStatementService.name);

  constructor(
    private readonly mt940Parser: MT940Parser,
    private readonly camt053Parser: CAMT053Parser,
  ) { }

  async processFile(file: Express.Multer.File, fileExtension: string): Promise<MT940Result | CAMT053Result> {
    const content = file.buffer.toString('utf-8');

    this.logger.log(`Processing ${fileExtension.toUpperCase()} file...`);
    this.logger.log(`File size: ${file.size} bytes`);

    if (fileExtension === '940') {
      return this.mt940Parser.parseMT940(content);
    } else if (fileExtension === 'xml') {
      return this.camt053Parser.parseCAMT053(content);
    }

    throw new Error('Unsupported file format');
  }
}
