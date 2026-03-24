import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { PaymentRequest, PaymentRequestDocument, PaymentStatus } from './schemas/payment.schema';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { WalletService } from '../wallet/wallet.service';
import { generateWallet } from '../../utils/wallet-generator.util';
import { generateEIP681QR } from '../../utils/qr-generator.util';
import { Currency, PAYMENT_EXPIRY_MINUTES } from '../../common/constants';

@Injectable()
export class PaymentService {
  constructor(
    @InjectModel(PaymentRequest.name)
    private readonly paymentModel: Model<PaymentRequestDocument>,
    private readonly walletService: WalletService,
  ) {}

  async create(
    dto: CreatePaymentDto,
    merchantId: string,
  ): Promise<PaymentRequestDocument> {
    const { address, privateKey } = generateWallet();
    const qrCodeUrl = await generateEIP681QR(
      address,
      dto.amount.toString(),
      dto.currency as Currency,
    );
    const expiresAt = new Date(Date.now() + PAYMENT_EXPIRY_MINUTES * 60 * 1000);

    const payment = await this.paymentModel.create({
      MerchantId: merchantId,
      Amount: dto.amount,
      Currency: dto.currency,
      WalletAddress: address,
      QrCodeUrl: qrCodeUrl,
      Description: dto.description,
      ExpiresAt: expiresAt,
      Status: PaymentStatus.PENDING,
    });

    await this.walletService.saveWallet(
      address,
      privateKey,
      (payment._id as Types.ObjectId).toString(),
    );

    return payment;
  }

  async findAll(merchantId: string): Promise<PaymentRequestDocument[]> {
    return this.paymentModel
      .find({ MerchantId: merchantId })
      .sort({ createdAt: -1 })
      .exec();
  }

  async findOne(id: string, merchantId: string): Promise<PaymentRequestDocument> {
    const payment = await this.paymentModel
      .findOne({ _id: id, MerchantId: merchantId })
      .exec();
    if (!payment) {
      throw new NotFoundException(`Payment ${id} not found`);
    }
    return payment;
  }

  async findPublic(id: string): Promise<PaymentRequestDocument> {
    const payment = await this.paymentModel.findById(id).exec();
    if (!payment) {
      throw new NotFoundException(`Payment ${id} not found`);
    }
    return payment;
  }
}

