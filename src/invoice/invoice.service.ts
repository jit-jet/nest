// src/invoice/invoice.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Invoice, InvoiceDocument } from './schemas/invoice.schema';
import { CreateInvoiceDto } from './dto/create-invoice.dto';

@Injectable()
export class InvoiceService {
  constructor(
    @InjectModel(Invoice.name) private readonly invoiceModel: Model<InvoiceDocument>,
  ) {}

  /**
   * Create a new invoice
   */
  async create(createInvoiceDto: CreateInvoiceDto): Promise<Invoice> {
    const createdInvoice = new this.invoiceModel(createInvoiceDto);
    return createdInvoice.save();
  }

  /**
   * Find an invoice by its ID
   */
  async findById(id: string): Promise<Invoice> {
    const invoice = await this.invoiceModel.findById(id).exec();
    if (!invoice) {
      throw new NotFoundException(`Invoice with ID ${id} not found`);
    }
    return invoice;
  }

  /**
   * Find all invoices with optional filters
   */
  async findAll(filters: { startDate?: string; endDate?: string }): Promise<Invoice[]> {
    const query = {};
    if (filters.startDate && filters.endDate) {
      query['date'] = {
        $gte: new Date(filters.startDate),
        $lte: new Date(filters.endDate),
      };
    }
    return this.invoiceModel.find(query).exec();
  }
}
