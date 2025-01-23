// src/invoice/dto/create-invoice.dto.ts
import { IsString, IsNumber, IsDate, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class ItemDto {
  @IsString()
  sku: string;

  @IsNumber()
  qt: number;
}

export class CreateInvoiceDto {
  @IsString()
  customer: string;

  @IsNumber()
  amount: number;

  @IsString()
  reference: string;

  @Type(() => Date)
  @IsDate()
  date: Date;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ItemDto)
  items: ItemDto[];
}
