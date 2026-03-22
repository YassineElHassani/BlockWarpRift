/* eslint-disable @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access */
import { Test, TestingModule } from '@nestjs/testing';
import { ethers } from 'ethers';
import { BlockchainListener } from './blockchain.listener';
import { BlockchainService } from './blockchain.service';
import { TransactionService } from '../transaction/transaction.service';
import { PaymentGateway } from '../websocket/websocket.gateway';
import { PaymentStatus } from '../payment/schemas/payment.schema';
import { TransactionStatus } from '../transaction/schemas/transaction.schema';
import { Currency } from '../../common/constants';

describe('BlockchainListener', () => {
  let listener: BlockchainListener;

  const mockBlockchainService = {
    markExpired: jest.fn(),
    getPendingPayments: jest.fn(),
    getProvider: jest.fn(),
    parseEthAmount: jest.fn(),
    parseTokenAmount: jest.fn(),
    getErc20Interface: jest.fn(),
    updatePaymentStatus: jest.fn(),
  };

  const mockTransactionService = {
    findByTxHash: jest.fn(),
    create: jest.fn(),
    updateConfirmations: jest.fn(),
  };

  const mockPaymentGateway = {
    emitPaymentUpdated: jest.fn(),
    emitPaymentConfirmed: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BlockchainListener,
        { provide: BlockchainService, useValue: mockBlockchainService },
        { provide: TransactionService, useValue: mockTransactionService },
        { provide: PaymentGateway, useValue: mockPaymentGateway },
      ],
    }).compile();

    listener = module.get<BlockchainListener>(BlockchainListener);
    jest.clearAllMocks();
  });

  describe('poll', () => {
    it('should expire stale payments and exit early when no pending payments exist', async () => {
      mockBlockchainService.markExpired.mockResolvedValue(undefined);
      mockBlockchainService.getPendingPayments.mockResolvedValue([]);

      await (listener as any).poll();

      expect(mockBlockchainService.markExpired).toHaveBeenCalledTimes(1);
      expect(mockBlockchainService.getProvider).not.toHaveBeenCalled();
    });

    it('should process each pending ETH payment against the current block', async () => {
      const payment = {
        _id: 'payment1',
        MerchantId: 'merchant1',
        WalletAddress: '0xwallet',
        Amount: 0.1,
        Currency: Currency.ETH,
      };

      const mockProvider = {
        getBlockNumber: jest.fn().mockResolvedValue(200),
        getBlock: jest.fn().mockResolvedValue({ prefetchedTransactions: [] }),
      };

      mockBlockchainService.markExpired.mockResolvedValue(undefined);
      mockBlockchainService.getPendingPayments.mockResolvedValue([payment]);
      mockBlockchainService.getProvider.mockReturnValue(mockProvider);

      await (listener as any).poll();

      expect(mockProvider.getBlockNumber).toHaveBeenCalled();
      expect(mockProvider.getBlock).toHaveBeenCalledWith(200, true);
    });
  });

  describe('handleConfirmation', () => {
    const baseArgs = {
      txHash: '0xTXHASH',
      from: '0xFROM',
      to: '0xTO',
      amount: 0.1,
      currency: Currency.ETH,
      paymentId: 'payment1',
      merchantId: 'merchant1',
      currentBlock: 100,
      txBlock: 97,
    };

    it('should create a new transaction record when first encountered', async () => {
      mockTransactionService.findByTxHash.mockResolvedValue(null);
      mockTransactionService.create.mockResolvedValue({ _id: 'tx1' });
      mockTransactionService.updateConfirmations.mockResolvedValue(undefined);
      mockBlockchainService.updatePaymentStatus.mockResolvedValue(undefined);

      await (listener as any).handleConfirmation(
        baseArgs.txHash,
        baseArgs.from,
        baseArgs.to,
        baseArgs.amount,
        baseArgs.currency,
        baseArgs.paymentId,
        baseArgs.merchantId,
        baseArgs.currentBlock,
        baseArgs.txBlock,
      );

      expect(mockTransactionService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          txHash: '0xTXHASH',
          paymentRequestId: 'payment1',
          merchantId: 'merchant1',
          amount: 0.1,
          currency: Currency.ETH,
        }),
      );
    });

    it('should NOT create a duplicate transaction when txHash already exists', async () => {
      mockTransactionService.findByTxHash.mockResolvedValue({
        _id: 'tx1',
        TxHash: '0xTXHASH',
      });
      mockTransactionService.updateConfirmations.mockResolvedValue(undefined);
      mockBlockchainService.updatePaymentStatus.mockResolvedValue(undefined);

      await (listener as any).handleConfirmation(
        baseArgs.txHash,
        baseArgs.from,
        baseArgs.to,
        baseArgs.amount,
        baseArgs.currency,
        baseArgs.paymentId,
        baseArgs.merchantId,
        baseArgs.currentBlock,
        baseArgs.txBlock,
      );

      expect(mockTransactionService.create).not.toHaveBeenCalled();
    });

    it('should mark payment PAID and emit payment.confirmed when 3+ confirmations are reached', async () => {
      // currentBlock=100, txBlock=98 → 100 - 98 + 1 = 3 confirmations
      mockTransactionService.findByTxHash.mockResolvedValue(null);
      mockTransactionService.create.mockResolvedValue({ _id: 'tx1' });
      mockTransactionService.updateConfirmations.mockResolvedValue(undefined);
      mockBlockchainService.updatePaymentStatus.mockResolvedValue(undefined);

      await (listener as any).handleConfirmation(
        baseArgs.txHash,
        baseArgs.from,
        baseArgs.to,
        baseArgs.amount,
        baseArgs.currency,
        baseArgs.paymentId,
        baseArgs.merchantId,
        100,
        98, // exactly 3 confirmations
      );

      expect(mockTransactionService.updateConfirmations).toHaveBeenCalledWith(
        '0xTXHASH',
        3,
        TransactionStatus.CONFIRMED,
      );
      expect(mockBlockchainService.updatePaymentStatus).toHaveBeenCalledWith(
        'payment1',
        PaymentStatus.PAID,
      );
      expect(mockPaymentGateway.emitPaymentConfirmed).toHaveBeenCalledWith(
        'payment1',
        expect.objectContaining({
          txHash: '0xTXHASH',
          status: PaymentStatus.PAID,
        }),
      );
    });

    it('should emit payment.updated with PENDING status when below required confirmations', async () => {
      // currentBlock=100, txBlock=99 → 2 confirmations (< 3 required)
      mockTransactionService.findByTxHash.mockResolvedValue(null);
      mockTransactionService.create.mockResolvedValue({ _id: 'tx1' });
      mockTransactionService.updateConfirmations.mockResolvedValue(undefined);

      await (listener as any).handleConfirmation(
        baseArgs.txHash,
        baseArgs.from,
        baseArgs.to,
        baseArgs.amount,
        baseArgs.currency,
        baseArgs.paymentId,
        baseArgs.merchantId,
        100,
        99, // only 2 confirmations
      );

      expect(mockBlockchainService.updatePaymentStatus).not.toHaveBeenCalled();
      expect(mockTransactionService.updateConfirmations).toHaveBeenCalledWith(
        '0xTXHASH',
        2,
        TransactionStatus.PENDING,
      );
      expect(mockPaymentGateway.emitPaymentUpdated).toHaveBeenCalledWith(
        'payment1',
        expect.objectContaining({
          status: PaymentStatus.PENDING,
          txHash: '0xTXHASH',
          confirmations: 2,
        }),
      );
    });

    it('should include amount and currency in the confirmed event payload', async () => {
      mockTransactionService.findByTxHash.mockResolvedValue({ _id: 'tx1' });
      mockTransactionService.updateConfirmations.mockResolvedValue(undefined);
      mockBlockchainService.updatePaymentStatus.mockResolvedValue(undefined);

      await (listener as any).handleConfirmation(
        '0xTX',
        '0xFROM',
        '0xTO',
        50.0,
        Currency.USDT,
        'payment2',
        'merchant2',
        100,
        98,
      );

      expect(mockPaymentGateway.emitPaymentConfirmed).toHaveBeenCalledWith(
        'payment2',
        expect.objectContaining({ amount: 50.0, currency: Currency.USDT }),
      );
    });
  });

  describe('checkEthPayment', () => {
    it('should skip transactions below the expected amount', async () => {
      const mockProvider = {
        getBlock: jest.fn().mockResolvedValue({
          prefetchedTransactions: [
            {
              hash: '0xTX',
              from: '0xFROM',
              to: '0xWALLET',
              value: ethers.parseEther('0.05'), // less than expected 0.1
              blockNumber: 100,
            },
          ],
        }),
      };
      mockBlockchainService.parseEthAmount.mockReturnValue(0.05);

      await (listener as any).checkEthPayment(
        '0xWALLET',
        0.1,
        'p1',
        'm1',
        100,
        mockProvider,
      );

      expect(mockTransactionService.findByTxHash).not.toHaveBeenCalled();
    });

    it('should skip transactions targeting a different address', async () => {
      const mockProvider = {
        getBlock: jest.fn().mockResolvedValue({
          prefetchedTransactions: [
            {
              hash: '0xTX',
              from: '0xFROM',
              to: '0xOTHER',
              value: ethers.parseEther('1'),
              blockNumber: 100,
            },
          ],
        }),
      };
      mockBlockchainService.parseEthAmount.mockReturnValue(1.0);

      await (listener as any).checkEthPayment(
        '0xWALLET',
        0.1,
        'p1',
        'm1',
        100,
        mockProvider,
      );

      expect(mockTransactionService.findByTxHash).not.toHaveBeenCalled();
    });
  });
});
