import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  PaymentRequest,
  PaymentRequestDocument,
  PaymentStatus,
} from '../payment/schemas/payment.schema';
import {
  Transaction,
  TransactionDocument,
  TransactionStatus,
} from '../transaction/schemas/transaction.schema';

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectModel(PaymentRequest.name)
    private readonly paymentModel: Model<PaymentRequestDocument>,
    @InjectModel(Transaction.name)
    private readonly transactionModel: Model<TransactionDocument>,
  ) {}

  async getRevenue(merchantId: string): Promise<{
    totalRevenue: number;
    revenueByDay: { date: string; revenue: number }[];
    revenuePerCurrency: { currency: string; revenue: number }[];
  }> {
    const [totalResult, byDay, perCurrency] = await Promise.all([
      this.transactionModel.aggregate([
        {
          $match: {
            MerchantId: merchantId,
            Status: TransactionStatus.CONFIRMED,
          },
        },
        { $group: { _id: null, total: { $sum: '$Amount' } } },
      ]),

      this.transactionModel.aggregate([
        {
          $match: {
            MerchantId: merchantId,
            Status: TransactionStatus.CONFIRMED,
          },
        },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            revenue: { $sum: '$Amount' },
          },
        },
        { $sort: { _id: 1 } },
        { $project: { _id: 0, date: '$_id', revenue: 1 } },
      ]),

      this.transactionModel.aggregate([
        {
          $match: {
            MerchantId: merchantId,
            Status: TransactionStatus.CONFIRMED,
          },
        },
        { $group: { _id: '$Currency', revenue: { $sum: '$Amount' } } },
        { $project: { _id: 0, currency: '$_id', revenue: 1 } },
      ]),
    ]);

    return {
      totalRevenue: Number((totalResult as { total: number }[])[0]?.total ?? 0),
      revenueByDay: byDay as { date: string; revenue: number }[],
      revenuePerCurrency: perCurrency as {
        currency: string;
        revenue: number;
      }[],
    };
  }

  async getTransactionStats(merchantId: string): Promise<{
    total: number;
    confirmed: number;
    pending: number;
    failed: number;
    recentTransactions: TransactionDocument[];
  }> {
    const [total, confirmed, pending, failed, recentTransactions] =
      await Promise.all([
        this.transactionModel.countDocuments({ MerchantId: merchantId }),
        this.transactionModel.countDocuments({
          MerchantId: merchantId,
          Status: TransactionStatus.CONFIRMED,
        }),
        this.transactionModel.countDocuments({
          MerchantId: merchantId,
          Status: TransactionStatus.PENDING,
        }),
        this.transactionModel.countDocuments({
          MerchantId: merchantId,
          Status: TransactionStatus.FAILED,
        }),
        this.transactionModel
          .find({ MerchantId: merchantId })
          .sort({ createdAt: -1 })
          .limit(10)
          .exec(),
      ]);

    return { total, confirmed, pending, failed, recentTransactions };
  }

  async getPaymentStats(merchantId: string): Promise<{
    total: number;
    paid: number;
    pending: number;
    expired: number;
    failed: number;
  }> {
    const [total, paid, pending, expired, failed] = await Promise.all([
      this.paymentModel.countDocuments({ MerchantId: merchantId }),
      this.paymentModel.countDocuments({
        MerchantId: merchantId,
        Status: PaymentStatus.PAID,
      }),
      this.paymentModel.countDocuments({
        MerchantId: merchantId,
        Status: PaymentStatus.PENDING,
      }),
      this.paymentModel.countDocuments({
        MerchantId: merchantId,
        Status: PaymentStatus.EXPIRED,
      }),
      this.paymentModel.countDocuments({
        MerchantId: merchantId,
        Status: PaymentStatus.FAILED,
      }),
    ]);

    return { total, paid, pending, expired, failed };
  }
}
