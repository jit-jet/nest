// src/email/email.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EmailService } from './email.service';
import { EmailController } from './email.controller';

@Module({
  imports: [ConfigModule], // Include ConfigModule for environment variables
  controllers: [EmailController], // Include the EmailController
  providers: [EmailService], // Register the EmailService
  exports: [EmailService], // Export the EmailService for use in other modules
})
export class EmailModule {}
