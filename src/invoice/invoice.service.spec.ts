import { Test, TestingModule } from '@nestjs/testing';
import { InvoiceService } from './invoice.service';
import { getModelToken } from '@nestjs/mongoose';
import { Invoice } from './schemas/invoice.schema';
import { Model } from 'mongoose';

const mockInvoice = {
  _id: 'mocked-id', // Simulate MongoDB ObjectId
  customer: 'John Doe',
  amount: 200,
  reference: 'INV-1001',
  date: new Date(),
  items: [
    { sku: 'ITEM001', qt: 2 },
    { sku: 'ITEM002', qt: 3 },
  ],
  __v: 0, // Version key from Mongoose
};

const mockInvoiceArray = [mockInvoice]; // Mock for find()

describe('InvoiceService', () => {
  let service: InvoiceService;
  let model: Model<Invoice>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InvoiceService,
        {
          provide: getModelToken(Invoice.name),
          useValue: {
            new: jest.fn().mockResolvedValue(mockInvoice),
            constructor: jest.fn().mockResolvedValue(mockInvoice),
            find: jest.fn().mockResolvedValue(mockInvoiceArray), // Mock find()
            findById: jest.fn().mockResolvedValue(mockInvoice), // Mock findById()
            create: jest.fn().mockResolvedValue(mockInvoice), // Mock create()
            exec: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<InvoiceService>(InvoiceService);
    model = module.get<Model<Invoice>>(getModelToken(Invoice.name));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should create an invoice', async () => {
    jest.spyOn(model, 'create').mockResolvedValueOnce(mockInvoice as any); // Mock create method
    const result = await service.create(mockInvoice as any);
    expect(result).toEqual(mockInvoice);
  });

  it('should find an invoice by ID', async () => {
    jest.spyOn(model, 'findById').mockReturnValueOnce({
      exec: jest.fn().mockResolvedValueOnce(mockInvoice),
    } as any); // Mock findById()
    const result = await service.findById('mocked-id');
    expect(result).toEqual(mockInvoice);
  });

  it('should find all invoices', async () => {
    jest.spyOn(model, 'find').mockReturnValueOnce({
      exec: jest.fn().mockResolvedValueOnce(mockInvoiceArray),
    } as any); // Mock find()
    const result = await service.findAll({});
    expect(result).toEqual(mockInvoiceArray);
  });
});