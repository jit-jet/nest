// src/email/email.service.ts
import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as amqp from 'amqplib';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService implements OnModuleInit {
  private readonly logger = new Logger(EmailService.name);
  private rabbitMqChannel: amqp.Channel;
  private connection: amqp.Connection;

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    await this.initializeRabbitMQ();
  }

  private async initializeRabbitMQ() {
    try {
      this.connection = await amqp.connect(this.configService.get<string>('RABBITMQ_URI'));
      this.rabbitMqChannel = await this.connection.createChannel();
      await this.rabbitMqChannel.assertQueue('daily_sales_report', { durable: true });

      // Start consuming messages
      this.rabbitMqChannel.consume('daily_sales_report', this.handleMessage.bind(this), { noAck: false });
      this.logger.log('Connected to RabbitMQ and consuming from daily_sales_report');
    } catch (error) {
      this.logger.error('Failed to connect to RabbitMQ', error);
    }
  }

  // Publisher method to send messages to the queue
  async publishReport(report: any) {
    if (!this.rabbitMqChannel) {
      this.logger.error('RabbitMQ channel is not initialized');
      return;
    }
    this.rabbitMqChannel.sendToQueue(
      'daily_sales_report',
      Buffer.from(JSON.stringify(report)),
      { persistent: true },
    );
    this.logger.log('Daily sales summary report published to RabbitMQ');
  }

  // Consumer handler to process messages
  private async handleMessage(msg: amqp.ConsumeMessage | null) {
    if (msg) {
      try {
        const content = msg.content.toString();
        const report = JSON.parse(content);
        this.logger.log(`Received report: ${content}`);

        await this.sendEmail(report);
        this.rabbitMqChannel.ack(msg);
        this.logger.log('Email sent and message acknowledged');
      } catch (error) {
        this.logger.error('Failed to process message', error);
        // Optionally, implement retry logic or move to a dead-letter queue
        this.rabbitMqChannel.nack(msg, false, false);
      }
    }
  }

  // Email sending logic
  async sendEmail(report: any) {
    const transporter = nodemailer.createTransport({
      service: this.configService.get<string>('EMAIL_SERVICE'),
      auth: {
        user: this.configService.get<string>('EMAIL_USER'),
        pass: this.configService.get<string>('EMAIL_PASS'),
      },
    });

    const mailOptions = {
      from: this.configService.get<string>('EMAIL_FROM'),
      to: this.configService.get<string>('EMAIL_TO'),
      subject: `Daily Sales Summary Report - ${new Date(report.date).toLocaleDateString()}`,
      text: this.generateEmailContent(report),
      // Alternatively, use HTML content
    };

    await transporter.sendMail(mailOptions);
  }

  // Helper method to generate email content
  generateEmailContent(report: any): string {
    let content = `Daily Sales Summary Report for ${new Date(report.date).toLocaleDateString()}\n\n`;
    content += `Total Sales Amount: $${report.totalSalesAmount}\n\n`;
    content += `Per Item Sales Summary:\n`;
    report.perItemSalesSummary.forEach(item => {
      content += `SKU: ${item.sku}, Total Quantity Sold: ${item.totalQuantitySold}\n`;
    });
    return content;
  }
}
