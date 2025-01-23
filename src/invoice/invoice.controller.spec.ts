// src/invoice/invoice.controller.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { InvoiceModule } from './invoice.module';
import { MongooseModule } from '@nestjs/mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

describe('InvoiceController (e2e)', () => {
  let app: INestApplication;
  let mongod: MongoMemoryServer;

  beforeAll(async () => {
    mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        InvoiceModule,
        MongooseModule.forRoot(uri),
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/invoices (POST)', () => {
    return request(app.getHttpServer())
      .post('/invoices')
      .send({
        customer: 'Jane Doe',
        amount: 200,
        reference: 'INV-2002',
        date: new Date(),
        items: [{ sku: 'ITEM2', qt: 5 }],
      })
      .expect(201)
      .then(response => {
        expect(response.body.customer).toBe('Jane Doe');
        expect(response.body.amount).toBe(200);
      });
  });

  it('/invoices (GET)', async () => {
    const response = await request(app.getHttpServer())
      .get('/invoices')
      .expect(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBeGreaterThan(0);
  });

  afterAll(async () => {
    await app.close();
    await mongod.stop();
  });
});
