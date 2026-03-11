import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type PaymentRequestDocument = PaymentRequest & Document;

export enum PaymentStatus {
    PENDING = 'PENDING',
    PAID = 'PAID',
    FAILED = 'FAILED',
    EXPIRED = 'EXPIRED',
}

@Schema({ timestamps: true })
export class PaymentRequest {

    @Prop({ required: true })
    MerchantId: string;

    @Prop({ required: true })
    Amount: number;

    @Prop({ required: true })
    Currency: string;

    @Prop({ required: true })
    WalletAddress: string;

    @Prop()
    QrCodeUrl: string;

    @Prop({
        enum: PaymentStatus,
        default: PaymentStatus.PENDING,
    })
    Status: PaymentStatus;

    @Prop({ required: true })
    ExpiresAt: Date;

}

export const PaymentRequestSchema = SchemaFactory.createForClass(PaymentRequest);