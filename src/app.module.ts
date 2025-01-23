// src/app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ScheduleModule } from '@nestjs/schedule';
import { InvoiceModule } from './invoice/invoice.module';
import { EmailModule } from './invoice/email/email.module';


@Module({
  imports: [
    // Load .env configurations globally
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    // Connect to MongoDB (URI is loaded from .env)
    MongooseModule.forRoot(process.env.MONGODB_URI),

    // Enable cron jobs and scheduled tasks
    ScheduleModule.forRoot(),

    // Import feature modules
    InvoiceModule,
    EmailModule,
  ],
})
export class AppModule {}
