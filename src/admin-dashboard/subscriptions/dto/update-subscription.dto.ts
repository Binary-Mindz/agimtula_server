import { PartialType } from "@nestjs/swagger";
import { CreateSubscriptionPlanDto } from "./create-subscription.dto";

export class UpdateSubscriptionDto extends PartialType(CreateSubscriptionPlanDto){}