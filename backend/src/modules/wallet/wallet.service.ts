import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ConfigService } from '@nestjs/config';
import { Wallet, WalletDocument } from './schemas/wallet.schema';
import { encrypt, decrypt } from '../../utils/encryption.util';

@Injectable()
export class WalletService {
  constructor(
    @InjectModel(Wallet.name) private readonly walletModel: Model<WalletDocument>,
    private readonly configService: ConfigService,
  ) {}

  async saveWallet(
    address: string,
    privateKey: string,
    paymentRequestId: string,
  ): Promise<void> {
    const key = this.configService.get<string>('encryption.key', '');
    const privateKeyEncrypted = encrypt(privateKey, key);
    await this.walletModel.create({
      Address: address,
      PrivateKeyEncrypted: privateKeyEncrypted,
      PaymentRequestId: paymentRequestId,
    });
  }

  async getPrivateKey(paymentRequestId: string): Promise<string> {
    const wallet = await this.walletModel
      .findOne({ PaymentRequestId: paymentRequestId })
      .exec();
    if (!wallet) {
      throw new NotFoundException(`Wallet for payment ${paymentRequestId} not found`);
    }
    const key = this.configService.get<string>('encryption.key', '');
    return decrypt(wallet.PrivateKeyEncrypted, key);
  }
}
