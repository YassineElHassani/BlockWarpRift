import { Test, TestingModule } from '@nestjs/testing';
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
    updatePaymentStatus: jest.fn(),
  };

  const mockTransactionService = {
    findByTxHash: jest.fn(),
    findPendingTransactions: jest.fn(),
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
      const mockProvider = {
        getBlockNumber: jest.fn().mockResolvedValue(100),
        send: jest.fn().mockResolvedValue({ transfers: [] }),
      };

      mockBlockchainService.getProvider.mockReturnValue(mockProvider);
      mockTransactionService.findPendingTransactions.mockResolvedValue([]);
      mockBlockchainService.markExpired.mockResolvedValue(undefined);
      mockBlockchainService.getPendingPayments.mockResolvedValue([]);

      await (listener as any).poll();

      expect(mockBlockchainService.markExpired).toHaveBeenCalledTimes(1);
      expect(mockBlockchainService.getPendingPayments).toHaveBeenCalledTimes(1);
    });

    it('should process each pending ETH payment against the current block', async () => {
      const payment = {
        _id: 'payment1',
        MerchantId: 'merchant1',
        WalletAddress: '0xwallet',
        Amount: 0.1,
        Currency: Currency.ETH,
        createdAt: new Date(),
      };

      const mockProvider = {
        getBlockNumber: jest.fn().mockResolvedValue(200),
        send: jest.fn().mockResolvedValue({ transfers: [] }),
      };

      mockBlockchainService.getProvider.mockReturnValue(mockProvider);
      mockTransactionService.findPendingTransactions.mockResolvedValue([]);
      mockBlockchainService.markExpired.mockResolvedValue(undefined);
      mockBlockchainService.getPendingPayments.mockResolvedValue([payment]);

      await (listener as any).poll();

      expect(mockProvider.getBlockNumber).toHaveBeenCalled();
      // checkEthPayment uses provider.send for alchemy_getAssetTransfers
      expect(mockProvider.send).toHaveBeenCalledWith(
        'alchemy_getAssetTransfers',
        expect.anything(),
      );
    });
  });

  describe('processPendingTransactions', () => {
    it('should confirm a pending tx that has reached required confirmations', async () => {
      const pendingTx = {
        TxHash: '0xPENDING',
        BlockNumber: 95,
        PaymentRequestId: 'pay1',
        Amount: 0.5,
        Currency: Currency.ETH,
      };

      mockTransactionService.findPendingTransactions.mockResolvedValue([pendingTx]);
      mockTransactionService.updateConfirmations.mockResolvedValue(undefined);
      mockBlockchainService.updatePaymentStatus.mockResolvedValue(undefined);

      // currentBlock=100, txBlock=95 → 6 confirmations (>= 3)
      await (listener as any).processPendingTransactions(100);

      expect(mockTransactionService.updateConfirmations).toHaveBeenCalledWith(
        '0xPENDING',
        6,
        TransactionStatus.CONFIRMED,
      );
      expect(mockBlockchainService.updatePaymentStatus).toHaveBeenCalledWith(
        'pay1',
        PaymentStatus.PAID,
      );
      expect(mockPaymentGateway.emitPaymentConfirmed).toHaveBeenCalledWith(
        'pay1',
        expect.objectContaining({
          status: PaymentStatus.PAID,
          txHash: '0xPENDING',
          confirmations: 6,
        }),
      );
    });

    it('should keep a pending tx as PENDING when below required confirmations', async () => {
      const pendingTx = {
        TxHash: '0xPENDING',
        BlockNumber: 99,
        PaymentRequestId: 'pay1',
        Amount: 0.5,
        Currency: Currency.ETH,
      };

      mockTransactionService.findPendingTransactions.mockResolvedValue([pendingTx]);
      mockTransactionService.updateConfirmations.mockResolvedValue(undefined);

      // currentBlock=100, txBlock=99 → 2 confirmations (< 3)
      await (listener as any).processPendingTransactions(100);

      expect(mockTransactionService.updateConfirmations).toHaveBeenCalledWith(
        '0xPENDING',
        2,
        TransactionStatus.PENDING,
      );
      expect(mockBlockchainService.updatePaymentStatus).not.toHaveBeenCalled();
    });

    it('should skip pending txs that have no BlockNumber', async () => {
      const pendingTx = {
        TxHash: '0xNOBLOCK',
        BlockNumber: null,
        PaymentRequestId: 'pay1',
      };

      mockTransactionService.findPendingTransactions.mockResolvedValue([pendingTx]);

      await (listener as any).processPendingTransactions(100);

      expect(mockTransactionService.updateConfirmations).not.toHaveBeenCalled();
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
      mockTransactionService.findByTxHash.mockResolvedValue(null);
      mockTransactionService.create.mockResolvedValue({ _id: 'tx1' });
      mockTransactionService.updateConfirmations.mockResolvedValue(undefined);
      mockBlockchainService.updatePaymentStatus.mockResolvedValue(undefined);

      // currentBlock=100, txBlock=98 → 3 confirmations
      await (listener as any).handleConfirmation(
        baseArgs.txHash,
        baseArgs.from,
        baseArgs.to,
        baseArgs.amount,
        baseArgs.currency,
        baseArgs.paymentId,
        baseArgs.merchantId,
        100,
        98,
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
      mockTransactionService.findByTxHash.mockResolvedValue(null);
      mockTransactionService.create.mockResolvedValue({ _id: 'tx1' });
      mockTransactionService.updateConfirmations.mockResolvedValue(undefined);

      // currentBlock=100, txBlock=99 → 2 confirmations (< 3 required)
      await (listener as any).handleConfirmation(
        baseArgs.txHash,
        baseArgs.from,
        baseArgs.to,
        baseArgs.amount,
        baseArgs.currency,
        baseArgs.paymentId,
        baseArgs.merchantId,
        100,
        99,
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
        Currency.ETH,
        'payment2',
        'merchant2',
        100,
        98,
      );

      expect(mockPaymentGateway.emitPaymentConfirmed).toHaveBeenCalledWith(
        'payment2',
        expect.objectContaining({ amount: 50.0, currency: Currency.ETH }),
      );
    });
  });

  describe('checkEthPayment', () => {
    it('should skip transfers below the expected amount', async () => {
      const mockProvider = {
        send: jest.fn().mockResolvedValue({
          transfers: [
            {
              hash: '0xTX',
              from: '0xFROM',
              value: 0.05, // less than expected 0.1
              blockNum: '0x64', // 100
            },
          ],
        }),
      };

      await (listener as any).checkEthPayment(
        '0xWALLET',
        0.1,
        'p1',
        'm1',
        100,
        mockProvider,
        new Date(),
      );

      expect(mockTransactionService.findByTxHash).not.toHaveBeenCalled();
    });

    it('should process a valid transfer that meets the expected amount', async () => {
      const mockProvider = {
        send: jest.fn().mockResolvedValue({
          transfers: [
            {
              hash: '0xVALID',
              from: '0xFROM',
              value: 0.15,
              blockNum: '0x62', // 98
            },
          ],
        }),
      };

      // First call in checkEthPayment (dedup check) returns null → proceed
      // Second call inside handleConfirmation also returns null → create new tx
      mockTransactionService.findByTxHash.mockResolvedValue(null);
      mockTransactionService.create.mockResolvedValue({ _id: 'tx1' });
      mockTransactionService.updateConfirmations.mockResolvedValue(undefined);
      mockBlockchainService.updatePaymentStatus.mockResolvedValue(undefined);

      await (listener as any).checkEthPayment(
        '0xWALLET',
        0.1,
        'p1',
        'm1',
        100,
        mockProvider,
        new Date(),
      );

      expect(mockTransactionService.findByTxHash).toHaveBeenCalledWith('0xVALID');
      expect(mockTransactionService.create).toHaveBeenCalled();
    });

    it('should skip transfers already claimed by another payment', async () => {
      const mockProvider = {
        send: jest.fn().mockResolvedValue({
          transfers: [
            {
              hash: '0xCLAIMED',
              from: '0xFROM',
              value: 0.2,
              blockNum: '0x64',
            },
          ],
        }),
      };

      mockTransactionService.findByTxHash.mockResolvedValue({ _id: 'existing' });

      await (listener as any).checkEthPayment(
        '0xWALLET',
        0.1,
        'p1',
        'm1',
        100,
        mockProvider,
        new Date(),
      );

      // findByTxHash was called for dedup, but create should NOT be called
      expect(mockTransactionService.findByTxHash).toHaveBeenCalledWith('0xCLAIMED');
      expect(mockTransactionService.create).not.toHaveBeenCalled();
    });

    it('should handle empty transfers gracefully', async () => {
      const mockProvider = {
        send: jest.fn().mockResolvedValue({ transfers: [] }),
      };

      await (listener as any).checkEthPayment(
        '0xWALLET',
        0.1,
        'p1',
        'm1',
        100,
        mockProvider,
        new Date(),
      );

      expect(mockTransactionService.findByTxHash).not.toHaveBeenCalled();
    });
  });
});
