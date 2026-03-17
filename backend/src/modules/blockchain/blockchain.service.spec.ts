import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { ConfigService } from '@nestjs/config';
import { ethers } from 'ethers';
import { BlockchainService } from './blockchain.service';
import { PaymentRequest, PaymentStatus } from '../payment/schemas/payment.schema';

jest.mock('../../config/blockchain.config', () => ({
  createProvider: jest.fn(() => ({ destroy: jest.fn() })),
}));

describe('BlockchainService', () => {
  let service: BlockchainService;

  const mockPaymentModel = {
    find: jest.fn(),
    updateMany: jest.fn(),
    findByIdAndUpdate: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BlockchainService,
        {
          provide: ConfigService,
          useValue: { get: jest.fn().mockReturnValue('https://mock-rpc.example.com') },
        },
        { provide: getModelToken(PaymentRequest.name), useValue: mockPaymentModel },
      ],
    }).compile();

    service = module.get<BlockchainService>(BlockchainService);
    service.onModuleInit();
    jest.clearAllMocks();
  });

  describe('parseEthAmount', () => {
    it('should convert wei to ETH correctly', () => {
      expect(service.parseEthAmount(ethers.parseEther('1.5'))).toBeCloseTo(1.5, 8);
    });

    it('should return 0 for zero wei', () => {
      expect(service.parseEthAmount(0n)).toBe(0);
    });
  });

  describe('parseTokenAmount', () => {
    it('should convert 6-decimal token units to a float', () => {
      expect(service.parseTokenAmount(1_000_000n)).toBeCloseTo(1.0, 5);
    });

    it('should handle amounts with decimals', () => {
      expect(service.parseTokenAmount(500_000n)).toBeCloseTo(0.5, 5);
    });
  });

  describe('getPendingPayments', () => {
    it('should query for PENDING payments that have not yet expired', async () => {
      const mockPayments = [{ _id: 'p1', Status: 'PENDING' }];
      mockPaymentModel.find.mockReturnValue({ exec: jest.fn().mockResolvedValue(mockPayments) });

      const result = await service.getPendingPayments();

      const query = mockPaymentModel.find.mock.calls[0][0];
      expect(query.Status).toBe(PaymentStatus.PENDING);
      expect(query.ExpiresAt).toBeDefined();
      expect(result).toEqual(mockPayments);
    });
  });

  describe('markExpired', () => {
    it('should update PENDING payments past their ExpiresAt to EXPIRED', async () => {
      mockPaymentModel.updateMany.mockReturnValue({ exec: jest.fn().mockResolvedValue({ modifiedCount: 2 }) });

      await service.markExpired();

      const [filter, update] = mockPaymentModel.updateMany.mock.calls[0];
      expect(filter.Status).toBe(PaymentStatus.PENDING);
      expect(filter.ExpiresAt).toBeDefined();
      expect(update).toEqual({ $set: { Status: PaymentStatus.EXPIRED } });
    });
  });

  describe('updatePaymentStatus', () => {
    it('should call findByIdAndUpdate with the correct id and status', async () => {
      const updated = { _id: 'p1', Status: PaymentStatus.PAID };
      mockPaymentModel.findByIdAndUpdate.mockReturnValue({ exec: jest.fn().mockResolvedValue(updated) });

      const result = await service.updatePaymentStatus('p1', PaymentStatus.PAID);

      expect(mockPaymentModel.findByIdAndUpdate).toHaveBeenCalledWith(
        'p1',
        { $set: { Status: PaymentStatus.PAID } },
        { new: true },
      );
      expect(result).toEqual(updated);
    });
  });

  describe('getErc20Interface', () => {
    it('should return a valid ethers Interface', () => {
      const iface = service.getErc20Interface();
      expect(iface).toBeInstanceOf(ethers.Interface);
    });
  });
});
