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

  /**
   * Lifecycle hook to initialize RabbitMQ connection
   */
  async onModuleInit() {
    await this.initializeRabbitMQ();
  }

  /**
   * Initializes the RabbitMQ connection and sets up the consumer
   */
  private async initializeRabbitMQ() {
    try {
      this.connection = await amqp.connect(this.configService.get<string>('RABBITMQ_URI'));
      this.rabbitMqChannel = await this.connection.createChannel();
      await this.rabbitMqChannel.assertQueue('daily_sales_report', { durable: true });

      // Start consuming messages
      this.rabbitMqChannel.consume('daily_sales_report', this.handleMessage.bind(this), {
        noAck: false,
      });
      this.logger.log('Connected to RabbitMQ and consuming from daily_sales_report');
    } catch (error) {
      this.logger.error('Failed to connect to RabbitMQ', error);
    }
  }

  /**
   * Publishes a sales report to the RabbitMQ queue
   * @param report - The sales report data
   */
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

  /**
   * Handles incoming RabbitMQ messages
   * @param msg - The RabbitMQ message
   */
  private async handleMessage(msg: amqp.ConsumeMessage | null) {
    if (msg) {
      try {
        const content = msg.content.toString();
        const report = JSON.parse(content);
        this.logger.log(`Received report: ${content}`);

        await this.sendEmail({
          to: this.configService.get<string>('EMAIL_TO'),
          subject: `Daily Sales Summary - ${new Date(report.date).toLocaleDateString()}`,
          text: this.generateEmailContent(report),
        });

        this.rabbitMqChannel.ack(msg);
        this.logger.log('Email sent and message acknowledged');
      } catch (error) {
        this.logger.error('Failed to process message', error);
        this.rabbitMqChannel.nack(msg, false, false);
      }
    }
  }

  /**
   * Sends an email using Nodemailer
   * @param emailOptions - Email details (to, subject, text)
   */
  async sendEmail(emailOptions: { to: string; subject: string; text: string }) {
    const transporter = nodemailer.createTransport({
      service: this.configService.get<string>('EMAIL_SERVICE'),
      auth: {
        user: this.configService.get<string>('EMAIL_USER'),
        pass: this.configService.get<string>('EMAIL_PASS'),
      },
    });

    const mailOptions = {
      from: this.configService.get<string>('EMAIL_FROM'),
      to: emailOptions.to,
      subject: emailOptions.subject,
      text: emailOptions.text,
    };

    await transporter.sendMail(mailOptions);
    this.logger.log(`Email sent to ${emailOptions.to}`);
  }

  /**
   * Generates the email content for the sales report
   * @param report - The sales report data
   * @returns The formatted email content
   */
  private generateEmailContent(report: any): string {
    let content = `Daily Sales Summary Report for ${new Date(report.date).toLocaleDateString()}\n\n`;
    content += `Total Sales Amount: $${report.totalSalesAmount}\n\n`;
    content += `Per Item Sales Summary:\n`;
    report.perItemSalesSummary.forEach(item => {
      content += `SKU: ${item.sku}, Total Quantity Sold: ${item.totalQuantitySold}\n`;
    });
    return content;
  }
}
