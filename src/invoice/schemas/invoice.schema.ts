// src/invoice/schemas/invoice.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type InvoiceDocument = Invoice & Document;

@Schema()
export class Item {
  @Prop({ required: true })
  sku: string;

  @Prop({ required: true })
  qt: number;
}

const ItemSchema = SchemaFactory.createForClass(Item);

@Schema({ timestamps: true })
export class Invoice {
  @Prop({ required: true })
  customer: string;

  @Prop({ required: true })
  amount: number;

  @Prop({ required: true, unique: true })
  reference: string;

  @Prop({ required: true })
  date: Date;

  @Prop({ type: [ItemSchema], default: [] })
  items: Item[];
}

export const InvoiceSchema = SchemaFactory.createForClass(Invoice);
