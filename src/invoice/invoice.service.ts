import {
  Body,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { isValidObjectId, Model } from 'mongoose';
import { Invoice, InvoiceDocument } from './schemas/invoice.schema';
import { CreateInvoiceDto } from './dto/create-invoice.dto';

@Injectable()
export class InvoiceService {
  constructor(
    @InjectModel(Invoice.name)
    private readonly invoiceModel: Model<InvoiceDocument>,
  ) {}

  async create(@Body() createInvoiceDto: CreateInvoiceDto): Promise<Invoice> {
    // Check for duplicate SKUs in the items array
    const skuSet = new Set(createInvoiceDto.items.map((item) => item.sku));

    if (skuSet.size != createInvoiceDto.items.length) {
      throw new ConflictException('Duplicate SKU found');
    }
    return new this.invoiceModel(createInvoiceDto).save();
  }

  async findById(id: string): Promise<Invoice> {
    if (!isValidObjectId(id)) {
      throw new NotFoundException(`Invoice with ID '${id}' not found`);
    }
    const invoice = await this.invoiceModel.findById(id).exec();
    if (!invoice) {
      throw new NotFoundException(`Invoice with ID ${id} not found`);
    }
    return invoice;
  }

  async findAll(filters: {
    startDate?: string;
    endDate?: string;
  }): Promise<Invoice[]> {
    const query: any = {};
    if (filters.startDate) query.date = { $gte: new Date(filters.startDate) };
    if (filters.endDate)
      query.date = { ...query.date, $lte: new Date(filters.endDate) };
    return this.invoiceModel.find(query).exec();
  }
}
