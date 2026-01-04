import { logpriority, LogType } from "prisma/generated/prisma/enums";

export class CreateLoggerDto {
  level: LogType;
  logpriority: logpriority;
  information: string;
}