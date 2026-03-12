import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { BlockchainService } from './blockchain.service';
import { BlockchainListener } from './blockchain.listener';
import { TransactionModule } from '../transaction/transaction.module';
import { PaymentRequest, PaymentRequestSchema } from '../payment/schemas/payment.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: PaymentRequest.name, schema: PaymentRequestSchema }]),
    ConfigModule,
    TransactionModule,
  ],
  providers: [BlockchainService, BlockchainListener],
  exports: [BlockchainService],
})
export class BlockchainModule {}
