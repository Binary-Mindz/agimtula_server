import { PartialType } from '@nestjs/swagger';
import { CreateCustomUserDto } from './create-custom-user.dto';

export class UpdateCustomUserDto extends PartialType(CreateCustomUserDto) {}
