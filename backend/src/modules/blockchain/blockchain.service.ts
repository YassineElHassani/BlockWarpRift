import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ethers } from 'ethers';
import { createProvider } from '../../config/blockchain.config';
import {
  PaymentRequest,
  PaymentRequestDocument,
  PaymentStatus,
} from '../payment/schemas/payment.schema';

@Injectable()
export class BlockchainService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(BlockchainService.name);
  private provider!: ethers.JsonRpcProvider;

  constructor(
    private readonly configService: ConfigService,
    @InjectModel(PaymentRequest.name)
    private readonly paymentModel: Model<PaymentRequestDocument>,
  ) {}

  onModuleInit() {
    this.provider = createProvider(this.configService);
    this.logger.log('Blockchain provider initialized');
  }

  onModuleDestroy() {
    this.provider.destroy();
  }

  getProvider(): ethers.JsonRpcProvider {
    return this.provider;
  }

  async getPendingPayments(): Promise<PaymentRequestDocument[]> {
    const now = new Date();
    return this.paymentModel
      .find({ Status: PaymentStatus.PENDING, ExpiresAt: { $gt: now } })
      .exec();
  }

  async markExpired(): Promise<void> {
    const now = new Date();
    await this.paymentModel
      .updateMany(
        { Status: PaymentStatus.PENDING, ExpiresAt: { $lte: now } },
        { $set: { Status: PaymentStatus.EXPIRED } },
      )
      .exec();
  }

  async updatePaymentStatus(
    paymentId: string,
    status: PaymentStatus,
  ): Promise<PaymentRequestDocument | null> {
    return this.paymentModel
      .findByIdAndUpdate(paymentId, { $set: { Status: status } }, { new: true })
      .exec();
  }

  parseEthAmount(value: bigint): number {
    return parseFloat(ethers.formatEther(value));
  }
}
