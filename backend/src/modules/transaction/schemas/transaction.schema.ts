import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type TransactionDocument = Transaction & Document;

export enum TransactionStatus {
    PENDING = 'PENDING',
    CONFIRMED = 'CONFIRMED',
    FAILED = 'FAILED',
}

@Schema({ timestamps: true })
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
