// src/invoice/invoice.controller.ts
import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  Query,
} from '@nestjs/common';
import { InvoiceService } from './invoice.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { Invoice } from './schemas/invoice.schema';

@Controller('invoices')
export class InvoiceController {
  constructor(private readonly invoiceService: InvoiceService) {}

  @Post()
  async create(@Body() createInvoiceDto: CreateInvoiceDto): Promise<Invoice> {
    return this.invoiceService.create(createInvoiceDto);
  }

  @Get(':id')
  async findById(@Param('id') id: string): Promise<Invoice> {
    const invoice = await this.invoiceService.findById(id);
    return invoice;
  }

  @Get()
  async findAll(
    @Query('startDate') startDate?: string | undefined,
    @Query('endDate') endDate?: string | undefined,
  ): Promise<Invoice[]> {
    const filters = { startDate, endDate };
    return this.invoiceService.findAll(filters);
  }
}
