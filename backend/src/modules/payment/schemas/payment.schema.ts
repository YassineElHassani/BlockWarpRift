import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type PaymentRequestDocument = PaymentRequest & Document;

export enum PaymentStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  FAILED = 'FAILED',
  EXPIRED = 'EXPIRED',
}

@Schema({
  timestamps: true,
  toJSON: {
    transform(_doc: unknown, ret: Record<string, unknown>) {
      ret._id = ret._id?.toString();
      ret.merchantId = ret.MerchantId;
      delete ret.MerchantId;
      ret.amount = ret.Amount;
      delete ret.Amount;
      ret.currency = ret.Currency;
      delete ret.Currency;
      ret.walletAddress = ret.WalletAddress;
      delete ret.WalletAddress;
      ret.qrCode = ret.QrCodeUrl;
      delete ret.QrCodeUrl;
      ret.description = ret.Description;
      delete ret.Description;
      ret.status = ret.Status;
      delete ret.Status;
      ret.expiresAt = ret.ExpiresAt;
      delete ret.ExpiresAt;
      delete ret.__v;
      return ret;
    },
  },
})

export class PaymentRequest {
  @Prop({ required: true })
  MerchantId!: string;

  @Prop({ required: true })
  Amount!: number;

  @Prop({ required: true })
  Currency!: string;

  @Prop({ required: true })
  WalletAddress!: string;

  @Prop()
  QrCodeUrl!: string;

  @Prop()
  Description?: string;

  @Prop({
    enum: PaymentStatus,
    default: PaymentStatus.PENDING,
  })
  Status!: PaymentStatus;

  @Prop({ required: true })
  ExpiresAt!: Date;
}

export const PaymentRequestSchema =
  SchemaFactory.createForClass(PaymentRequest);
