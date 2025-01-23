// src/invoice/invoice.controller.ts
import { Controller, Post, Get, Param, Body, Query } from '@nestjs/common';
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
    return this.invoiceService.findById(id);
  }

  @Get()
  async findAll(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ): Promise<Invoice[]> {
    const filters = startDate && endDate ? { startDate, endDate } : {};
    return this.invoiceService.findAll(filters);
  }
}
