// src/email/email.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { EmailService } from './email.service';
import { ConfigModule } from '@nestjs/config';
import * as amqp from 'amqplib';
import * as nodemailer from 'nodemailer';
import { Logger } from '@nestjs/common';

jest.mock('amqplib');
jest.mock('nodemailer');

describe('EmailService', () => {
  let service: EmailService;
  let mockSendMail: jest.Mock;

  beforeEach(async () => {
    mockSendMail = jest.fn().mockResolvedValue(true);

    (nodemailer.createTransport as jest.Mock).mockReturnValue({
      sendMail: mockSendMail,
    });

    const module: TestingModule = await Test.createTestingModule({
      imports: [ConfigModule.forRoot()],
      providers: [EmailService],
    }).compile();

    service = module.get<EmailService>(EmailService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should publish report to RabbitMQ', async () => {
    const mockChannel = {
      sendToQueue: jest.fn(),
    };
    (amqp.connect as jest.Mock).mockResolvedValue({
      createChannel: jest.fn().mockResolvedValue(mockChannel),
    });

    await service.onModuleInit();
    const report = { totalSalesAmount: 1000, perItemSalesSummary: [] };
    await service.publishReport(report);
    expect(mockChannel.sendToQueue).toHaveBeenCalled();
  });

  it('should send email with report', async () => {
    const report = {
      date: new Date(),
      totalSalesAmount: 500,
      perItemSalesSummary: [{ sku: 'ITEM1', totalQuantitySold: 10 }],
    };
    await service.sendEmail(report);
    expect(mockSendMail).toHaveBeenCalled();
  });

  it('should handle incoming messages and send emails', async () => {
    const mockAck = jest.fn();
    const mockNack = jest.fn();
    const mockChannel = {
      ack: mockAck,
      nack: mockNack,
    };
    const mockMessage = {
      content: Buffer.from(JSON.stringify({
        date: new Date(),
        totalSalesAmount: 500,
        perItemSalesSummary: [{ sku: 'ITEM1', totalQuantitySold: 10 }],
      })),
    };

    service['rabbitMqChannel'] = mockChannel as any;

    await service['handleMessage'](mockMessage as any);
    expect(mockSendMail).toHaveBeenCalled();
    expect(mockAck).toHaveBeenCalled();
  });

  it('should nack message on failure', async () => {
    const mockAck = jest.fn();
    const mockNack = jest.fn();
    const mockChannel = {
      ack: mockAck,
      nack: mockNack,
    };
    const mockMessage = {
      content: Buffer.from('invalid json'),
    };

    service['rabbitMqChannel'] = mockChannel as any;

    await service['handleMessage'](mockMessage as any);
    expect(mockNack).toHaveBeenCalled();
    expect(mockAck).not.toHaveBeenCalled();
  });
});
