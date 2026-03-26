import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  PaymentRequest,
  PaymentRequestDocument,
  PaymentStatus,
} from './schemas/payment.schema';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UsersService } from '../users/users.service';
import { generateEIP681QR } from '../../utils/qr-generator.util';
import { PAYMENT_EXPIRY_MINUTES } from '../../common/constants';

@Injectable()
export class PaymentService {
  constructor(
    @InjectModel(PaymentRequest.name)
    private readonly paymentModel: Model<PaymentRequestDocument>,
    private readonly usersService: UsersService,
  ) {}

  async create(
    dto: CreatePaymentDto,
    merchantId: string,
  ): Promise<PaymentRequestDocument> {
    const merchant = await this.usersService.findById(merchantId);
    if (!merchant?.WalletAddress) {
      throw new BadRequestException(
        'Connect your wallet before creating a payment request',
      );
    }

    const walletAddress = merchant.WalletAddress;
    const qrCodeUrl = await generateEIP681QR(
      walletAddress,
      dto.amount.toString(),
      dto.currency,
    );
    const expiresAt = new Date(Date.now() + PAYMENT_EXPIRY_MINUTES * 60 * 1000);

    return this.paymentModel.create({
      MerchantId: merchantId,
      Amount: dto.amount,
      Currency: dto.currency,
      WalletAddress: walletAddress,
      QrCodeUrl: qrCodeUrl,
      Description: dto.description,
      ExpiresAt: expiresAt,
      Status: PaymentStatus.PENDING,
    });
  }

  async findAll(merchantId: string): Promise<PaymentRequestDocument[]> {
    return this.paymentModel
      .find({ MerchantId: merchantId })
      .sort({ createdAt: -1 })
      .exec();
  }

  async findOne(
    id: string,
    merchantId: string,
  ): Promise<PaymentRequestDocument> {
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
