import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { ethers } from 'ethers';
import { BlockchainService } from './blockchain.service';
import { TransactionService } from '../transaction/transaction.service';
import { PaymentGateway } from '../websocket/websocket.gateway';
import { PaymentStatus } from '../payment/schemas/payment.schema';
import { TransactionStatus } from '../transaction/schemas/transaction.schema';
import { Currency } from '../../common/constants';

const REQUIRED_CONFIRMATIONS = 3;
const POLL_INTERVAL_MS = 1_000; // 1 second

@Injectable()
export class BlockchainListener implements OnApplicationBootstrap {
  private readonly logger = new Logger(BlockchainListener.name);
  private pollTimer: ReturnType<typeof setInterval> | null = null;

  constructor(
    private readonly blockchainService: BlockchainService,
    private readonly transactionService: TransactionService,
    private readonly paymentGateway: PaymentGateway,
  ) { }

  onApplicationBootstrap() {
    this.logger.log('Starting blockchain listener...');
    this.pollTimer = setInterval(() => {
      void this.poll();
    }, POLL_INTERVAL_MS);
    // Run immediately on startup
    this.poll().catch((err) => this.logger.error('Initial poll failed', err));
  }

  private async poll(): Promise<void> {
    try {
      // push any already-detected transactions toward confirmation
      const provider = this.blockchainService.getProvider();
      const currentBlock = await provider.getBlockNumber();
      await this.processPendingTransactions(currentBlock);

      // Expire stale payments *after* we've processed pending txs
      await this.blockchainService.markExpired();

      const pendingPayments = await this.blockchainService.getPendingPayments();
      if (pendingPayments.length === 0) return;

      for (const payment of pendingPayments) {
        const paymentId = (payment._id as unknown as string).toString();
        const merchantId = payment.MerchantId;

        await this.checkEthPayment(
          payment.WalletAddress,
          payment.Amount,
          paymentId,
          merchantId,
          currentBlock,
          provider,
          (payment as unknown as { createdAt: Date }).createdAt,
        );
      }
    } catch (err) {
      this.logger.error('Blockchain poll error', err);
    }
  }

  private async processPendingTransactions(currentBlock: number): Promise<void> {
    const pendingTxs = await this.transactionService.findPendingTransactions();
    for (const tx of pendingTxs) {
      if (!tx.BlockNumber) continue;
      const confirmations = currentBlock - tx.BlockNumber + 1;
      const txHash = tx.TxHash;
      const paymentId = tx.PaymentRequestId;

      if (confirmations >= REQUIRED_CONFIRMATIONS) {
        await this.transactionService.updateConfirmations(
          txHash,
          confirmations,
          TransactionStatus.CONFIRMED,
        );

        await this.blockchainService.updatePaymentStatus(
          paymentId,
          PaymentStatus.PAID,
        );

        this.logger.log(
          `Payment ${paymentId} confirmed via pending-tx sweep (${confirmations} confirmations)`,
        );

        this.paymentGateway.emitPaymentConfirmed(paymentId, {
          status: PaymentStatus.PAID,
          txHash,
          confirmations,
          amount: tx.Amount,
          currency: tx.Currency,
        });

        this.paymentGateway.emitPaymentUpdated(paymentId, {
          status: PaymentStatus.PAID,
          txHash,
          confirmations,
        });
      } else {
        await this.transactionService.updateConfirmations(
          txHash,
          confirmations,
          TransactionStatus.PENDING,
        );

        this.logger.log(
          `Pending tx ${txHash}: ${confirmations}/${REQUIRED_CONFIRMATIONS} confirmations`,
        );
      }
    }
  }

  private async checkEthPayment(
    walletAddress: string,
    expectedAmount: number,
    paymentId: string,
    merchantId: string,
    currentBlock: number,
    provider: ethers.JsonRpcProvider,
    createdAt?: Date,
  ): Promise<void> {
    const secondsSinceCreation = createdAt ? Math.floor((Date.now() - createdAt.getTime()) / 1000) : 300;
    const blockLookback = Math.ceil(secondsSinceCreation / 12) + 10;
    const fromBlock = Math.max(0, currentBlock - blockLookback);

    // Use Alchemy's asset-transfers endpoint to efficiently scan the full range
    const result = (await provider.send('alchemy_getAssetTransfers', [
      {
        fromBlock: ethers.toQuantity(fromBlock),
        toBlock: 'latest',
        toAddress: walletAddress,
        category: ['external'],
        withMetadata: false,
        excludeZeroValue: true,
      },
    ])) as { transfers: Array<{ hash: string; from: string; value: number; blockNum: string }> };

    for (const transfer of result?.transfers ?? []) {
      if (transfer.value < expectedAmount) continue;

      // Skip transactions already claimed by another payment (shared merchant wallet)
      const existingTx = await this.transactionService.findByTxHash(transfer.hash);
      if (existingTx) continue;

      const txBlock = parseInt(transfer.blockNum, 16);
      await this.handleConfirmation(
        transfer.hash,
        transfer.from,
        walletAddress,
        transfer.value,
        Currency.ETH,
        paymentId,
        merchantId,
        currentBlock,
        txBlock,
      );

      break;
    }
  }

  private async handleConfirmation(
    txHash: string,
    from: string,
    to: string,
    amount: number,
    currency: string,
    paymentId: string,
    merchantId: string,
    currentBlock: number,
    txBlock: number,
  ): Promise<void> {
    const confirmations = currentBlock - txBlock + 1;

    let existing = await this.transactionService.findByTxHash(txHash);
    if (!existing) {
      existing = await this.transactionService.create({
        paymentRequestId: paymentId,
        txHash,
        merchantId,
        fromAddress: from,
        toAddress: to,
        amount,
        currency,
        blockNumber: txBlock,
      });

      this.logger.log(
        `New tx detected: ${txHash} (${confirmations} confirmations)`,
      );
    }

    if (confirmations >= REQUIRED_CONFIRMATIONS) {
      await this.transactionService.updateConfirmations(
        txHash,
        confirmations,
        TransactionStatus.CONFIRMED,
      );

      await this.blockchainService.updatePaymentStatus(
        paymentId,
        PaymentStatus.PAID,
      );

      this.logger.log(
        `Payment ${paymentId} confirmed after ${confirmations} confirmations`,
      );

      this.paymentGateway.emitPaymentConfirmed(paymentId, {
        status: PaymentStatus.PAID,
        txHash,
        confirmations,
        amount,
        currency,
      });

      this.paymentGateway.emitPaymentUpdated(paymentId, {
        status: PaymentStatus.PAID,
        txHash,
        confirmations,
      });
    } else {
      await this.transactionService.updateConfirmations(
        txHash,
        confirmations,
        TransactionStatus.PENDING,
      );

      this.logger.log(
        `Payment ${paymentId}: ${confirmations}/${REQUIRED_CONFIRMATIONS} confirmations`,
      );

      this.paymentGateway.emitPaymentUpdated(paymentId, {
        status: PaymentStatus.PENDING,
        txHash,
        confirmations,
        required: REQUIRED_CONFIRMATIONS,
      });
    }
  }
}
