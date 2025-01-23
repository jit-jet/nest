// src/email/email.controller.ts
import { Controller, Post, Body, HttpCode, HttpStatus, Get } from '@nestjs/common';
import { EmailService } from './email.service';

@Controller('email')
export class EmailController {
  constructor(private readonly emailService: EmailService) {}

  @Get('status')
  @HttpCode(HttpStatus.OK)
  getStatus() {
    return { status: 'Email service is running' };
  }

  @Post('send')
  @HttpCode(HttpStatus.OK)
  async sendTestEmail(@Body() emailData: any) {
    const { to, subject, text } = emailData;
    await this.emailService.sendEmail({
      to,
      subject,
      text,
    });
    return { message: 'Email sent successfully' };
  }
}
