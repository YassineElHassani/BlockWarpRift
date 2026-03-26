/* eslint-disable @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment */
import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { PaymentRequest, PaymentStatus } from './schemas/payment.schema';
import { UsersService } from '../users/users.service';
import * as qrUtil from '../../utils/qr-generator.util';

describe('PaymentService', () => {
  let service: PaymentService;

  const mockPaymentModel = {
    create: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
  };

  const mockUsersService = {
    findById: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentService,
        {
          provide: getModelToken(PaymentRequest.name),
          useValue: mockPaymentModel,
        },
        { provide: UsersService, useValue: mockUsersService },
      ],
    }).compile();

    service = module.get<PaymentService>(PaymentService);
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should use the merchant wallet address and create the payment record', async () => {
      mockUsersService.findById.mockResolvedValue({
        _id: 'merchant1',
        WalletAddress: '0xMERCHANT',
      });
      jest
        .spyOn(qrUtil, 'generateEIP681QR')
        .mockResolvedValue('data:image/png;base64,QR');

      const mockPayment = {
        _id: 'pay1',
        MerchantId: 'merchant1',
        Amount: 0.1,
        Currency: 'ETH',
        WalletAddress: '0xMERCHANT',
        Status: PaymentStatus.PENDING,
      };
      mockPaymentModel.create.mockResolvedValue(mockPayment);

      const result = await service.create(
        { amount: 0.1, currency: 'ETH' as any },
        'merchant1',
      );

      expect(mockPaymentModel.create).toHaveBeenCalledWith(
        expect.objectContaining({
          MerchantId: 'merchant1',
          Amount: 0.1,
          Currency: 'ETH',
          WalletAddress: '0xMERCHANT',
          QrCodeUrl: 'data:image/png;base64,QR',
          Status: PaymentStatus.PENDING,
        }),
      );
      expect(result).toEqual(mockPayment);
    });

    it('should throw BadRequestException when merchant has no wallet', async () => {
      mockUsersService.findById.mockResolvedValue({
        _id: 'merchant1',
        WalletAddress: null,
      });

      await expect(
        service.create({ amount: 1, currency: 'ETH' as any }, 'merchant1'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should set ExpiresAt 15 minutes in the future', async () => {
      mockUsersService.findById.mockResolvedValue({
        _id: 'm1',
        WalletAddress: '0xA',
      });
      jest.spyOn(qrUtil, 'generateEIP681QR').mockResolvedValue('data:qr');
      mockPaymentModel.create.mockResolvedValue({ _id: 'p1' });

      const before = Date.now();
      await service.create({ amount: 1, currency: 'ETH' as any }, 'm1');
      const after = Date.now();

      const createCall = mockPaymentModel.create.mock.calls[0][0];
      const expiresAt: Date = createCall.ExpiresAt;
      expect(expiresAt.getTime()).toBeGreaterThanOrEqual(
        before + 15 * 60 * 1000 - 100,
      );
      expect(expiresAt.getTime()).toBeLessThanOrEqual(
        after + 15 * 60 * 1000 + 100,
      );
    });
  });

  describe('findAll', () => {
    it('should return all payments for the given merchant sorted by date', async () => {
      const mockPayments = [{ _id: '1' }, { _id: '2' }];
      mockPaymentModel.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(mockPayments),
        }),
      });

      const result = await service.findAll('merchant1');

      expect(mockPaymentModel.find).toHaveBeenCalledWith({
        MerchantId: 'merchant1',
      });
      expect(result).toEqual(mockPayments);
    });
  });

  describe('findOne', () => {
    it('should return the payment when found', async () => {
      const mockPayment = { _id: 'p1', MerchantId: 'merchant1' };
      mockPaymentModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockPayment),
      });

      const result = await service.findOne('p1', 'merchant1');

      expect(mockPaymentModel.findOne).toHaveBeenCalledWith({
        _id: 'p1',
        MerchantId: 'merchant1',
      });
      expect(result).toEqual(mockPayment);
    });

    it('should throw NotFoundException when payment does not exist', async () => {
      mockPaymentModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(service.findOne('nonexistent', 'merchant1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
