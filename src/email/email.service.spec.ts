import { Test, TestingModule } from '@nestjs/testing';
import { EmailService } from './email.service';
import * as nodemailer from 'nodemailer';

jest.mock('nodemailer'); // Mock nodemailer

describe('EmailService', () => {
  let service: EmailService;
  let sendMailMock: jest.Mock;

  beforeEach(async () => {
    // Mock nodemailer.createTransport
    sendMailMock = jest.fn();
    (nodemailer.createTransport as jest.Mock).mockReturnValue({
      sendMail: sendMailMock,
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [EmailService],
    }).compile();

    service = module.get<EmailService>(EmailService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should send an email successfully', async () => {
    // Mock the response of sendMail
    sendMailMock.mockResolvedValueOnce({ accepted: ['recipient@example.com'] });

    // Mock report data
    const report = {
      date: '2025-01-25T12:00:00.000Z',
      totalSalesAmount: 1200,
      perItemSalesSummary: [
        { sku: 'ITEM001', totalQuantitySold: 5 },
        { sku: 'ITEM002', totalQuantitySold: 3 },
      ],
    };

    // Call the sendEmail method
    await service['sendEmail'](report);

    // Verify sendMail was called with the correct parameters
    expect(sendMailMock).toHaveBeenCalledTimes(1);
    expect(sendMailMock).toHaveBeenCalledWith({
      from: process.env.EMAIL_FROM,
      to: process.env.EMAIL_TO,
      subject: `Daily Sales Summary - ${new Date(report.date).toLocaleDateString()}`,
      text: expect.stringContaining('Total Sales Amount: $1200'),
    });
  });

  it('should log an error if sending email fails', async () => {
    const loggerErrorSpy = jest.spyOn(service['logger'], 'error');

    // Mock sendMail to throw an error
    sendMailMock.mockRejectedValueOnce(new Error('Failed to send email'));

    // Mock report data
    const report = {
      date: '2025-01-25T12:00:00.000Z',
      totalSalesAmount: 1200,
      perItemSalesSummary: [
        { sku: 'ITEM001', totalQuantitySold: 5 },
        { sku: 'ITEM002', totalQuantitySold: 3 },
      ],
    };

    // Call the sendEmail method
    await service['sendEmail'](report);

    // Verify that an error was logged
    expect(loggerErrorSpy).toHaveBeenCalledWith('Failed to send email', expect.any(Error));
  });
});
