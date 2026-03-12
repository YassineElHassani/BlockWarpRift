import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { ethers } from 'ethers';
import { BlockchainService } from './blockchain.service';
import { TransactionService } from '../transaction/transaction.service';
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

        if (payment.Currency === Currency.ETH) {
          await this.checkEthPayment(payment.WalletAddress, payment.Amount, paymentId, currentBlock, provider);
        } else {
          await this.checkErc20Payment(payment.WalletAddress, payment.Amount, payment.Currency, paymentId, currentBlock, provider);
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
    currentBlock: number,
    provider: ethers.JsonRpcProvider,
  ): Promise<void> {
    // Scan the last 50 blocks for incoming ETH transfers to this address
    const fromBlock = Math.max(0, currentBlock - 50);
    const history = await provider.send('eth_getTransactionCountByAddress', []).catch(() => null);

    // Use getLogs approach — filter by toAddress via tracing is not available on all nodes.
    // Instead, check balance change heuristic: look at recent blocks.
    const filter: ethers.Filter = {
      fromBlock,
      toBlock: 'latest',
    };

    const block = await provider.getBlock(currentBlock, true);
    if (!block || !block.prefetchedTransactions) return;

    for (const tx of block.prefetchedTransactions) {
      if (!tx.to || tx.to.toLowerCase() !== walletAddress.toLowerCase()) continue;

      const amount = this.blockchainService.parseEthAmount(tx.value);
      if (amount < expectedAmount) continue;

      await this.handleConfirmation(tx.hash, tx.from, walletAddress, amount, Currency.ETH, paymentId, currentBlock, tx.blockNumber ?? currentBlock, provider);
      break;
    }
  }

  private async checkErc20Payment(
    walletAddress: string,
    expectedAmount: number,
    currency: string,
    paymentId: string,
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
        currentBlock,
        log.blockNumber,
        provider,
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
    currentBlock: number,
    txBlock: number,
    provider: ethers.JsonRpcProvider,
  ): Promise<void> {
    const confirmations = currentBlock - txBlock + 1;

    let existing = await this.transactionService.findByTxHash(txHash);
    if (!existing) {
      existing = await this.transactionService.create({
        paymentRequestId: paymentId,
        txHash,
        fromAddress: from,
        toAddress: to,
        amount,
        currency,
      });
      this.logger.log(`New tx detected: ${txHash} (${confirmations} confirmations)`);
    }

    if (confirmations >= REQUIRED_CONFIRMATIONS) {
      await this.transactionService.updateConfirmations(txHash, confirmations, TransactionStatus.CONFIRMED);
      await this.blockchainService.updatePaymentStatus(paymentId, PaymentStatus.PAID);
      this.logger.log(`Payment ${paymentId} confirmed after ${confirmations} confirmations`);
    } else {
      await this.transactionService.updateConfirmations(txHash, confirmations, TransactionStatus.PENDING);
      this.logger.log(`Payment ${paymentId}: ${confirmations}/${REQUIRED_CONFIRMATIONS} confirmations`);
    }
  }
}
