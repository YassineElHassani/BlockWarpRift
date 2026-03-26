import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppController } from './../src/app.controller';
import { AppService } from './../src/app.service';
import { AuthController } from './../src/modules/auth/auth.controller';
import { AuthService } from './../src/modules/auth/auth.service';

describe('App (e2e)', () => {
  let app: INestApplication<App>;

  const mockAuthService = {
    register: jest.fn(),
    login: jest.fn(),
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [AppController, AuthController],
      providers: [
        AppService,
        { provide: AuthService, useValue: mockAuthService },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /api', () => {
    it('should return "Hello World!"', () => {
      return request(app.getHttpServer())
        .get('/api')
        .expect(200)
        .expect('BlockWarpRift Backend is running!');
    });
  });

  describe('POST /api/auth/register', () => {
    it('should reject empty body with 400', () => {
      return request(app.getHttpServer())
        .post('/api/auth/register')
        .send({})
        .expect(400);
    });

    it('should reject invalid email with 400', () => {
      return request(app.getHttpServer())
        .post('/api/auth/register')
        .send({ email: 'not-an-email', password: 'password123' })
        .expect(400);
    });

    it('should reject short password with 400', () => {
      return request(app.getHttpServer())
        .post('/api/auth/register')
        .send({ email: 'test@example.com', password: 'short' })
        .expect(400);
    });

    it('should reject unexpected fields with 400', () => {
      return request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          password: 'password123',
          role: 'ADMIN',
        })
        .expect(400);
    });

    it('should accept valid payload and call authService.register', async () => {
      mockAuthService.register.mockResolvedValue({
        message: 'User registered',
        user: {
          id: '123',
          email: 'test@example.com',
          role: 'MERCHANT',
          walletAddress: null,
        },
      });

      const res = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({ email: 'test@example.com', password: 'password123' })
        .expect(201);

      expect(res.body).toHaveProperty('user');
      expect((res.body as { user: { email: string } }).user.email).toBe(
        'test@example.com',
      );
      expect(mockAuthService.register).toHaveBeenCalled();
    });
  });

  describe('POST /api/auth/login', () => {
    it('should reject empty body with 400', () => {
      return request(app.getHttpServer())
        .post('/api/auth/login')
        .send({})
        .expect(400);
    });

    it('should accept valid credentials and call authService.login', async () => {
      mockAuthService.login.mockResolvedValue({
        access_token: 'jwt-token',
        user: {
          id: '123',
          email: 'test@example.com',
          role: 'MERCHANT',
          walletAddress: null,
        },
      });

      const res = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: 'test@example.com', password: 'password123' })
        .expect(200);

      expect(res.body).toHaveProperty('access_token');
      expect((res.body as { access_token: string }).access_token).toBe(
        'jwt-token',
      );
    });
  });
});
