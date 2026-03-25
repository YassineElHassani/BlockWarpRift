import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  Transaction,
  TransactionDocument,
  TransactionStatus,
} from './schemas/transaction.schema';

export interface CreateTransactionData {
  paymentRequestId: string;
  txHash: string;
  merchantId: string;
  fromAddress: string;
  toAddress: string;
  amount: number;
  currency: string;
  blockNumber?: number;
}

@Injectable()
export class TransactionService {
  constructor(
    @InjectModel(Transaction.name)
    private readonly transactionModel: Model<TransactionDocument>,
  ) {}

  async create(data: CreateTransactionData): Promise<TransactionDocument> {
    return this.transactionModel.create({
      PaymentRequestId: data.paymentRequestId,
      TxHash: data.txHash,
      MerchantId: data.merchantId,
      FromAddress: data.fromAddress,
      ToAddress: data.toAddress,
      Amount: data.amount,
      Currency: data.currency,
      Confirmations: 0,
      BlockNumber: data.blockNumber,
      Status: TransactionStatus.PENDING,
    });
  }

  async findByTxHash(txHash: string): Promise<TransactionDocument | null> {
    return this.transactionModel.findOne({ TxHash: txHash }).exec();
  }

  async findPendingTransactions(): Promise<TransactionDocument[]> {
    return this.transactionModel
      .find({ Status: TransactionStatus.PENDING })
      .exec();
  }

  async updateConfirmations(
    txHash: string,
    confirmations: number,
    status: TransactionStatus,
  ): Promise<void> {
    await this.transactionModel
      .updateOne(
        { TxHash: txHash },
        { $set: { Confirmations: confirmations, Status: status } },
      )
      .exec();
  }

  async findByPaymentRequest(
    paymentRequestId: string,
  ): Promise<TransactionDocument[]> {
    return this.transactionModel
      .find({ PaymentRequestId: paymentRequestId })
      .sort({ createdAt: -1 })
      .exec();
  }

  async findAllByMerchant(
    merchantId: string,
    page = 1,
    limit = 20,
  ): Promise<{
    data: TransactionDocument[];
    total: number;
    page: number;
    limit: number;
  }> {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.transactionModel
        .find({ MerchantId: merchantId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.transactionModel.countDocuments({ MerchantId: merchantId }).exec(),
    ]);
    return { data, total, page, limit };
  }

  async findAllGlobal(
    page = 1,
    limit = 20,
  ): Promise<{
    data: TransactionDocument[];
    total: number;
    page: number;
    limit: number;
  }> {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.transactionModel
        .find()
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.transactionModel.countDocuments().exec(),
    ]);
    return { data, total, page, limit };
  }
}
