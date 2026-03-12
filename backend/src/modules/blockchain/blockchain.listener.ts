import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { ethers } from 'ethers';
import { BlockchainService } from './blockchain.service';
import { TransactionService } from '../transaction/transaction.service';
import { PaymentGateway } from '../websocket/websocket.gateway';
import { PaymentStatus } from '../payment/schemas/payment.schema';
import { TransactionStatus } from '../transaction/schemas/transaction.schema';
import { Currency, ERC20_TOKEN_CONTRACTS } from '../../common/constants';

const REQUIRED_CONFIRMATIONS = 3;
const POLL_INTERVAL_MS = 15_000; // 15 seconds

@Injectable()
export class BlockchainListener implements OnApplicationBootstrap {
  private readonly logger = new Logger(BlockchainListener.name);
  private pollTimer: ReturnType<typeof setInterval> | null = null;

  constructor(
    private readonly blockchainService: BlockchainService,
    private readonly transactionService: TransactionService,
    private readonly paymentGateway: PaymentGateway,
  ) {}

  onApplicationBootstrap() {
    this.logger.log('Starting blockchain listener...');
    this.pollTimer = setInterval(() => this.poll(), POLL_INTERVAL_MS);
    // Run immediately on startup
    this.poll().catch((err) => this.logger.error('Initial poll failed', err));
  }

  private async poll(): Promise<void> {
    try {
      // Expire stale payments first
      await this.blockchainService.markExpired();

      const pendingPayments = await this.blockchainService.getPendingPayments();
      if (pendingPayments.length === 0) return;

      const provider = this.blockchainService.getProvider();
      const currentBlock = await provider.getBlockNumber();

      for (const payment of pendingPayments) {
        const paymentId = (payment._id as unknown as string).toString();
        const merchantId = payment.MerchantId;

        if (payment.Currency === Currency.ETH) {
          await this.checkEthPayment(payment.WalletAddress, payment.Amount, paymentId, merchantId, currentBlock, provider);
        } else {
          await this.checkErc20Payment(payment.WalletAddress, payment.Amount, payment.Currency, paymentId, merchantId, currentBlock, provider);
        }
      }
    } catch (err) {
      this.logger.error('Blockchain poll error', err);
    }
  }

  private async checkEthPayment(
    walletAddress: string,
    expectedAmount: number,
    paymentId: string,
    merchantId: string,
    currentBlock: number,
    provider: ethers.JsonRpcProvider,
  ): Promise<void> {
    // Scan the current block for incoming ETH transfers to this address
    const block = await provider.getBlock(currentBlock, true);
    if (!block || !block.prefetchedTransactions) return;

    for (const tx of block.prefetchedTransactions) {
      if (!tx.to || tx.to.toLowerCase() !== walletAddress.toLowerCase()) continue;

      const amount = this.blockchainService.parseEthAmount(tx.value);
      if (amount < expectedAmount) continue;

      await this.handleConfirmation(tx.hash, tx.from, walletAddress, amount, Currency.ETH, paymentId, merchantId, currentBlock, tx.blockNumber ?? currentBlock);
      break;
    }
  }

  private async checkErc20Payment(
    walletAddress: string,
    expectedAmount: number,
    currency: string,
    paymentId: string,
    merchantId: string,
    currentBlock: number,
    provider: ethers.JsonRpcProvider,
  ): Promise<void> {
    const tokenAddress = ERC20_TOKEN_CONTRACTS[currency];
    if (!tokenAddress) return;

    const iface = this.blockchainService.getErc20Interface();
    const fromBlock = Math.max(0, currentBlock - 50);

    const logs = await provider.getLogs({
      address: tokenAddress,
      topics: [
        ethers.id('Transfer(address,address,uint256)'),
        null,
        ethers.zeroPadValue(walletAddress, 32),
      ],
      fromBlock,
      toBlock: 'latest',
    });

    for (const log of logs) {
      const parsed = iface.parseLog({ topics: log.topics as string[], data: log.data });
      if (!parsed) continue;

      const amount = this.blockchainService.parseTokenAmount(parsed.args[2] as bigint);
      if (amount < expectedAmount) continue;

      await this.handleConfirmation(
        log.transactionHash,
        parsed.args[0] as string,
        walletAddress,
        amount,
        currency,
        paymentId,
        merchantId,
        currentBlock,
        log.blockNumber,
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
      this.logger.log(`New tx detected: ${txHash} (${confirmations} confirmations)`);
    }

    if (confirmations >= REQUIRED_CONFIRMATIONS) {
      await this.transactionService.updateConfirmations(txHash, confirmations, TransactionStatus.CONFIRMED);
      await this.blockchainService.updatePaymentStatus(paymentId, PaymentStatus.PAID);
      this.logger.log(`Payment ${paymentId} confirmed after ${confirmations} confirmations`);
      this.paymentGateway.emitPaymentConfirmed(paymentId, {
        status: PaymentStatus.PAID,
        txHash,
        confirmations,
        amount,
        currency,
      });
      // Also emit generic update so UI state machine has a single event to listen to
      this.paymentGateway.emitPaymentUpdated(paymentId, { status: PaymentStatus.PAID, txHash, confirmations });
    } else {
      await this.transactionService.updateConfirmations(txHash, confirmations, TransactionStatus.PENDING);
      this.logger.log(`Payment ${paymentId}: ${confirmations}/${REQUIRED_CONFIRMATIONS} confirmations`);
      this.paymentGateway.emitPaymentUpdated(paymentId, {
        status: PaymentStatus.PENDING,
        txHash,
        confirmations,
        required: REQUIRED_CONFIRMATIONS,
      });
    }
  }
}
