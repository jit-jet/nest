// src/invoice/dto/create-invoice.dto.ts
import { IsString, IsNumber, IsDate, IsArray, ValidateNested, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';

class ItemDto {
  @IsString()
  @IsNotEmpty()
  sku: string;

  @IsNumber()
  qt: number;
}

export class CreateInvoiceDto {
  @IsString()
  @IsNotEmpty() 
  customer: string;

  @IsNumber()
  amount: number;

  @IsString()
  @IsNotEmpty() 
  reference: string;

  @Type(() => Date)
  @IsDate()
  date: Date;

  @IsArray()
  @ValidateNested({ each: true }) 
  @Type(() => ItemDto) 
  items: ItemDto[];
}
