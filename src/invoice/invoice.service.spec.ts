import { Test, TestingModule } from '@nestjs/testing';
import { InvoiceService } from './invoice.service';
import { Invoice } from './schemas/invoice.schema';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';

describe('InvoiceService', () => {
  let service: InvoiceService;
  let mockInvoiceModel: Model<Invoice>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InvoiceService,
        {
          provide: getModelToken(Invoice.name),
          useValue: {
            new: jest.fn().mockResolvedValue({ save: jest.fn() }),
            findById: jest.fn(),
            find: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<InvoiceService>(InvoiceService);
    mockInvoiceModel = module.get<Model<Invoice>>(getModelToken(Invoice.name));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should throw a ConflictException if there are duplicate SKUs', async () => {
      const createInvoiceDto = {
        customer: 'John Doe',
        amount: 200,
        reference: 'INV-1003',
        date: new Date('2025-01-24T00:00:00.000Z'),
        items: [
          { sku: 'ITEM002', qt: 2, _id: '67aa39917981f4c0672dcf01' },
          { sku: 'ITEM002', qt: 5, _id: '67aa39917981f4c0672dcf02' }, // Duplicate SKU
        ],
      };

      await expect(service.create(createInvoiceDto)).rejects.toThrow(ConflictException);
    });

    it('should save the invoice if no duplicates are found', async () => {
      const createInvoiceDto = {
        customer: 'John Doe',
        amount: 200,
        reference: 'INV-1003',
        date: new Date('2025-01-24T00:00:00.000Z'),
        items: [
          { sku: 'ITEM001', qt: 2, _id: '67aa39917981f4c0672dcf01' },
          { sku: 'ITEM002', qt: 5, _id: '67aa39917981f4c0672dcf02' },
        ],
      };

      // Mock save method to resolve to the invoice object
      mockInvoiceModel.prototype.save.mockResolvedValue(createInvoiceDto);

      const result = await service.create(createInvoiceDto);

      expect(result).toEqual(createInvoiceDto);
      expect(mockInvoiceModel.prototype.save).toHaveBeenCalled();
    });
  });

  describe('findById', () => {
    it('should throw a NotFoundException if the invoice is not found', async () => {
      const id = '67aa39917981f4c0672dcf00';
      mockInvoiceModel.findById.mockResolvedValue(null);

      await expect(service.findById(id)).rejects.toThrow(NotFoundException);
    });

    it('should return the invoice if it is found', async () => {
      const id = '67aa39917981f4c0672dcf00';
      const invoice = { customer: 'John Doe', amount: 200, reference: 'INV-1003' };
      mockInvoiceModel.findById.mockResolvedValue(invoice);

      const result = await service.findById(id);

      expect(result).toEqual(invoice);
    });
  });

  describe('findAll', () => {
    it('should return an array of invoices based on filters', async () => {
      const filters = { startDate: '2025-01-01', endDate: '2025-02-01' };
      const invoices = [
        { customer: 'John Doe', amount: 200, reference: 'INV-1003' },
        { customer: 'Jane Doe', amount: 300, reference: 'INV-1004' },
      ];

      mockInvoiceModel.find.mockResolvedValue(invoices);

      const result = await service.findAll(filters);

      expect(result).toEqual(invoices);
      expect(mockInvoiceModel.find).toHaveBeenCalledWith({
        date: { $gte: new Date(filters.startDate), $lte: new Date(filters.endDate) },
      });
    });
  });
});
