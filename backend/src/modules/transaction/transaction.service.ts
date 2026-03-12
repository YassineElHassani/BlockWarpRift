import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Transaction, TransactionDocument, TransactionStatus } from './schemas/transaction.schema';

export interface CreateTransactionData {
  paymentRequestId: string;
  txHash: string;
  fromAddress: string;
  toAddress: string;
  amount: number;
  currency: string;
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
      FromAddress: data.fromAddress,
      ToAddress: data.toAddress,
      Amount: data.amount,
      Currency: data.currency,
      Confirmations: 0,
      Status: TransactionStatus.PENDING,
    });
  }

  async findByTxHash(txHash: string): Promise<TransactionDocument | null> {
    return this.transactionModel.findOne({ TxHash: txHash }).exec();
  }

  async updateConfirmations(
    txHash: string,
    confirmations: number,
    status: TransactionStatus,
  ): Promise<void> {
    await this.transactionModel
      .updateOne({ TxHash: txHash }, { $set: { Confirmations: confirmations, Status: status } })
      .exec();
  }

  async findByPaymentRequest(paymentRequestId: string): Promise<TransactionDocument[]> {
    return this.transactionModel
      .find({ PaymentRequestId: paymentRequestId })
      .sort({ createdAt: -1 })
      .exec();
  }
}

