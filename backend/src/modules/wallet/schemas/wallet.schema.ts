import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type WalletDocument = Wallet & Document;

@Schema({ timestamps: true })
export class Wallet {

    @Prop({ required: true })
    Address: string;

    @Prop({ required: true })
    PrivateKeyEncrypted: string;

    @Prop({ required: true })
    PaymentRequestId: string;

}

export const WalletSchema = SchemaFactory.createForClass(Wallet);