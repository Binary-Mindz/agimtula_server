import { PartialType } from '@nestjs/mapped-types';
import { CreateAccountantDto } from './create-accountant.dto';

export class UpdateAccountantDto extends PartialType(CreateAccountantDto) {}
