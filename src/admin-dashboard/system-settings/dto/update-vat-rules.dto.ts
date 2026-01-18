import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsNumber, IsOptional, IsString } from "class-validator";


class VatRule {
    @ApiProperty({
        name: "countryCode",
        description: "Country code for this Country"
    })
    @IsString()
    @IsNotEmpty()
    countryCode: string
        
    @ApiProperty({
        name: "standardRate",
        description: "Vat standard rate for this country",
        required: false
    })
    @IsOptional()
    @IsNumber()
    standardRate?: number;

    @ApiProperty({
        name: "reducedRate",
        description: "Vat reduced rate for this country",
        required: false
    })
    @IsOptional()
    @IsNumber()
    reducedRate?: number;
}

export class UpdateVatRulesDto {
   
    @ApiProperty({
        name: "vatRules",
        description: "Vat rules for countries",
        type: [VatRule]
    })
    vatRules: VatRule[]
    
}

