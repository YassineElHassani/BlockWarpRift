import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';

jest.mock('bcrypt', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

// eslint-disable-next-line @typescript-eslint/no-require-imports
const bcrypt = require('bcrypt') as { hash: jest.Mock; compare: jest.Mock };

describe('AuthService', () => {
  let service: AuthService;

  const mockUsersService = {
    findByEmail: jest.fn(),
    create: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn().mockReturnValue('mock.jwt.token'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: mockUsersService },
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should throw ConflictException when email is already in use', async () => {
      mockUsersService.findByEmail.mockResolvedValue({
        Email: 'taken@test.com',
      });

      await expect(
        service.register({ email: 'taken@test.com', password: 'pass123' }),
      ).rejects.toThrow(ConflictException);
    });

    it('should hash the password and create the user', async () => {
      mockUsersService.findByEmail.mockResolvedValue(null);
      mockUsersService.create.mockResolvedValue({
        _id: 'user1',
        Email: 'new@test.com',
        Role: 'merchant',
      });
      bcrypt.hash.mockResolvedValue('hashed_password');

      const result = await service.register({
        email: 'new@test.com',
        password: 'pass123',
      });

      expect(mockUsersService.create).toHaveBeenCalledWith({
        email: 'new@test.com',
        password: 'hashed_password',
      });
      expect(result.message).toBe('Registration successful');
      expect(result.user.email).toBe('new@test.com');
    });
  });

  describe('login', () => {
    it('should throw UnauthorizedException when user does not exist', async () => {
      mockUsersService.findByEmail.mockResolvedValue(null);

      await expect(
        service.login({ email: 'nobody@test.com', password: 'pass' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException when password does not match', async () => {
      mockUsersService.findByEmail.mockResolvedValue({
        _id: 'user1',
        Email: 'user@test.com',
        Password: 'hashed',
        Role: 'merchant',
      });
      bcrypt.compare.mockResolvedValue(false);

      await expect(
        service.login({ email: 'user@test.com', password: 'wrong' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should return an access_token on valid credentials', async () => {
      mockUsersService.findByEmail.mockResolvedValue({
        _id: 'user1',
        Email: 'user@test.com',
        Password: 'hashed',
        Role: 'merchant',
      });
      bcrypt.compare.mockResolvedValue(true);

      const result = await service.login({
        email: 'user@test.com',
        password: 'pass123',
      });

      expect(mockJwtService.sign).toHaveBeenCalled();
      expect(result.access_token).toBe('mock.jwt.token');
    });
  });
});
