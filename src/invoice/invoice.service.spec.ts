import { Test, TestingModule } from '@nestjs/testing';
import { InvoiceService } from './invoice.service';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Invoice } from './schemas/invoice.schema';
import { ConflictException, NotFoundException } from '@nestjs/common';

describe('InvoiceService', () => {
  let service: InvoiceService;
  let model: Model<Invoice>;

  const mockInvoice = {
    _id: '67aa4fad0dc0cbd366769d25',
    customer: 'John Doe',
    amount: 100,
    reference: 'INV-1001',
    date: new Date(),
    items: [{ sku: 'ITEM001', qt: 2 }],
  };

  const mockInvoiceModel = {
    create: jest.fn().mockResolvedValue(mockInvoice),
    findById: jest.fn().mockReturnThis(),
    find: jest.fn().mockReturnThis(),
    exec: jest.fn().mockResolvedValue(mockInvoice),  // Mocking the exec method
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InvoiceService,
        {
          provide: getModelToken(Invoice.name),
          useValue: mockInvoiceModel,
        },
      ],
    }).compile();

    service = module.get<InvoiceService>(InvoiceService);
    model = module.get<Model<Invoice>>(getModelToken(Invoice.name));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should successfully create an invoice', async () => {
      const createInvoiceDto = {
        customer: 'John Doe',
        amount: 100,
        reference: 'INV-1001',
        date: new Date(),
        items: [{ sku: 'ITEM001', qt: 2 }],
      };

      const result = await service.create(createInvoiceDto);
      expect(result).toEqual(mockInvoice);
      expect(mockInvoiceModel.create).toHaveBeenCalledWith(createInvoiceDto);
    });

    it('should throw ConflictException if duplicate SKUs are found', async () => {
      const createInvoiceDto = {
        customer: 'John Doe',
        amount: 100,
        reference: 'INV-1001',
        date: new Date(),
        items: [
          { sku: 'ITEM001', qt: 2 },
          { sku: 'ITEM001', qt: 3 },
        ],
      };

      await expect(service.create(createInvoiceDto)).rejects.toThrow(
        new ConflictException('Duplicate SKU found'),
      );
    });
  });

  describe('findById', () => {
    it('should return an invoice by ID', async () => {
      const result = await service.findById('67aa4fad0dc0cbd366769d25');
      expect(result).toEqual(mockInvoice);
      expect(mockInvoiceModel.findById).toHaveBeenCalledWith('67aa4fad0dc0cbd366769d25');
      expect(mockInvoiceModel.exec).toHaveBeenCalled();
    });

    it('should throw NotFoundException if the ID is invalid', async () => {
      await expect(service.findById('invalid-id')).rejects.toThrow(
        new NotFoundException("Invoice with ID 'invalid-id' not found"),
      );
    });

    it('should throw NotFoundException if the invoice is not found', async () => {
      mockInvoiceModel.exec.mockResolvedValueOnce(null);
      await expect(service.findById('67aa4fad0dc0cbd366769d25')).rejects.toThrow(
        new NotFoundException("Invoice with ID 67aa4fad0dc0cbd366769d25 not found"),
      );
    });
  });

  describe('findAll', () => {
    it('should return a list of invoices', async () => {
      const result = await service.findAll({});
      expect(result).toEqual(mockInvoice);
      expect(mockInvoiceModel.find).toHaveBeenCalledWith({});
      expect(mockInvoiceModel.exec).toHaveBeenCalled();
    });

    it('should return invoices filtered by startDate', async () => {
      const filters = { startDate: '2025-01-01' };
      await service.findAll(filters);
      expect(mockInvoiceModel.find).toHaveBeenCalledWith({
        date: { $gte: new Date(filters.startDate) },
      });
      expect(mockInvoiceModel.exec).toHaveBeenCalled();
    });

    it('should return invoices filtered by endDate', async () => {
      const filters = { endDate: '2025-01-31' };
      await service.findAll(filters);
      expect(mockInvoiceModel.find).toHaveBeenCalledWith({
        date: { $lte: new Date(filters.endDate) },
      });
      expect(mockInvoiceModel.exec).toHaveBeenCalled();
    });

    it('should return invoices filtered by both startDate and endDate', async () => {
      const filters = { startDate: '2025-01-01', endDate: '2025-01-31' };
      await service.findAll(filters);
      expect(mockInvoiceModel.find).toHaveBeenCalledWith({
        date: { $gte: new Date(filters.startDate), $lte: new Date(filters.endDate) },
      });
      expect(mockInvoiceModel.exec).toHaveBeenCalled();
    });
  });
});
