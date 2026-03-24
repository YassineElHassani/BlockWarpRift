import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type TransactionDocument = Transaction & Document;

export enum TransactionStatus {
    PENDING = 'PENDING',
    CONFIRMED = 'CONFIRMED',
    FAILED = 'FAILED',
}

@Schema({
  timestamps: true,
  toJSON: {
    transform(_doc: unknown, ret: Record<string, unknown>) {
      ret._id = ret._id?.toString()
      ret.paymentId = ret.PaymentRequestId; delete ret.PaymentRequestId
      ret.txHash = ret.TxHash; delete ret.TxHash
      ret.merchantId = ret.MerchantId; delete ret.MerchantId
      ret.fromAddress = ret.FromAddress; delete ret.FromAddress
      ret.toAddress = ret.ToAddress; delete ret.ToAddress
      ret.amount = ret.Amount; delete ret.Amount
      ret.currency = ret.Currency; delete ret.Currency
      ret.confirmations = ret.Confirmations; delete ret.Confirmations
      ret.blockNumber = ret.BlockNumber; delete ret.BlockNumber
      ret.status = ret.Status; delete ret.Status
      delete ret.__v
      return ret
    },
  },
})
export class Transaction {

    @Prop({ required: true, index: true })
    PaymentRequestId!: string;

    @Prop({ required: true, unique: true })
    TxHash!: string;

    @Prop({ required: true })
    MerchantId!: string;

    @Prop({ required: true })
    FromAddress!: string;

    @Prop({ required: true })
    ToAddress!: string;

    @Prop({ required: true })
    Amount!: number;

    @Prop({ required: true })
    Currency!: string;

    @Prop({ default: 0 })
    Confirmations!: number;

    @Prop()
    BlockNumber?: number;

    @Prop({
        enum: TransactionStatus,
        default: TransactionStatus.PENDING,
    })
    Status!: TransactionStatus;

}

export const TransactionSchema = SchemaFactory.createForClass(Transaction);
