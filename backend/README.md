# BlockWarpRift Backend

NestJS REST API and WebSocket server for the BlockWarpRift cryptocurrency payment gateway.

## Tech Stack

- NestJS 11, TypeScript
- MongoDB 7 with Mongoose
- Redis 7
- ethers.js 6 (Ethereum / Alchemy)
- Socket.IO via NestJS WebSockets
- Passport JWT authentication
- Helmet, class-validator, bcrypt

## Project Structure

```
src/
├── common/
│   ├── constants/        Shared enums (Currency, etc.)
│   ├── decorators/       @CurrentUser, @Roles
│   └── guards/           JwtGuard, RolesGuard
├── config/               Configuration factory (env vars)
├── database/             MongooseModule setup
├── modules/
│   ├── auth/             Registration and login (JWT)
│   ├── analytics/        Revenue and payment stats
│   ├── blockchain/       Blockchain listener and service
│   ├── payment/          Payment request management
│   ├── transaction/      On-chain transaction records
│   ├── users/            User management (admin)
│   └── websocket/        Socket.IO payment gateway
└── utils/
    └── qr-generator.util.ts   EIP-681 QR code generation
```

## Environment Variables

| Variable        | Description                              | Default                                 |
|-----------------|------------------------------------------|-----------------------------------------|
| PORT            | HTTP server port                         | 3000                                    |
| MONGODB_URI     | MongoDB connection string                | mongodb://localhost:27017/blockwarprift |
| JWT_SECRET      | JWT signing secret                       | changeme-secret                         |
| JWT_EXPIRES_IN  | JWT expiry duration                      | 7d                                      |
| ENCRYPTION_KEY  | 32-byte hex key for data encryption      |                                         |
| RPC_URL         | Ethereum JSON-RPC endpoint               |                                         |
| NETWORK         | Ethereum network name                    | sepolia                                 |
| REDIS_URL       | Redis connection URL                     | redis://localhost:6379                  |

## Installation

```bash
npm install
```

## Running

```bash
# Development (watch mode)
npm run start:dev

# Production build then start
npm run build
npm run start:prod
```

## Linting and Formatting

```bash
npm run lint
npm run format
```

## Testing

```bash
# Unit tests
npm run test

# Unit tests with coverage
npm run test:cov

# E2E tests
npm run test:e2e
```

## API Reference

All routes are prefixed with `/api`.

### Authentication

| Method | Path                  | Auth     | Description              |
|--------|-----------------------|----------|--------------------------|
| POST   | /api/auth/register    | None     | Register a new merchant  |
| POST   | /api/auth/login       | None     | Login, returns JWT token |

**Register body:**
```json
{ "email": "merchant@example.com", "password": "password123" }
```

**Login response:**
```json
{
  "access_token": "eyJ...",
  "user": { "id": "...", "email": "...", "role": "MERCHANT", "walletAddress": null }
}
```

### Payments

| Method | Path                      | Auth        | Description                            |
|--------|---------------------------|-------------|----------------------------------------|
| POST   | /api/payment              | JWT         | Create a new payment request           |
| GET    | /api/payment              | JWT         | List all payment requests for merchant |
| GET    | /api/payment/:id          | JWT         | Get a specific payment request         |
| GET    | /api/payment/public/:id   | None        | Public payment page data               |

**Create payment body:**
```json
{ "amount": 0.05, "currency": "ETH", "description": "Order #123" }
```

### Transactions

| Method | Path                          | Auth         | Description                            |
|--------|-------------------------------|--------------|----------------------------------------|
| GET    | /api/transaction              | JWT          | Paginated transactions for merchant    |
| GET    | /api/transaction/all          | JWT + ADMIN  | Paginated global transaction list      |
| GET    | /api/transaction/:paymentId   | JWT          | Transactions for a payment request     |

Query parameters: `page` (default 1), `limit` (default 20).

### Analytics

| Method | Path                         | Auth | Description                  |
|--------|------------------------------|------|------------------------------|
| GET    | /api/analytics/revenue       | JWT  | Revenue breakdown            |
| GET    | /api/analytics/transactions  | JWT  | Transaction count stats      |
| GET    | /api/analytics/payments      | JWT  | Payment status breakdown     |

### Users (Admin only)

| Method | Path             | Auth         | Description                  |
|--------|------------------|--------------|------------------------------|
| GET    | /api/users       | JWT + ADMIN  | List all users               |
| GET    | /api/users/:id   | JWT          | Get user by ID               |
| PUT    | /api/users/:id   | JWT          | Update user                  |
| DELETE | /api/users/:id   | JWT + ADMIN  | Delete user                  |

## WebSocket Events

The server emits real-time events to connected clients identified by their payment ID room.

| Event               | Payload                                                      |
|---------------------|--------------------------------------------------------------|
| payment.updated     | `{ status, txHash, confirmations, amount, currency }`        |
| payment.confirmed   | `{ status: PAID, txHash, confirmations, amount, currency }`  |

## Blockchain Polling

`BlockchainListener` polls on-chain activity on a configurable interval:

1. Marks expired payment requests as `EXPIRED`.
2. Fetches `PENDING` payment requests from the database.
3. Uses the Alchemy `alchemy_getAssetTransfers` API to find incoming transfers.
4. Tracks confirmation counts per transaction.
5. Marks a payment as `PAID` once a transaction reaches 3 or more confirmations.

$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## Deployment

When you're ready to deploy your NestJS application to production, there are some key steps you can take to ensure it runs as efficiently as possible. Check out the [deployment documentation](https://docs.nestjs.com/deployment) for more information.

If you are looking for a cloud-based platform to deploy your NestJS application, check out [Mau](https://mau.nestjs.com), our official platform for deploying NestJS applications on AWS. Mau makes deployment straightforward and fast, requiring just a few simple steps:

```bash
$ npm install -g @nestjs/mau
$ mau deploy
```

With Mau, you can deploy your application in just a few clicks, allowing you to focus on building features rather than managing infrastructure.

## Resources

Check out a few resources that may come in handy when working with NestJS:

- Visit the [NestJS Documentation](https://docs.nestjs.com) to learn more about the framework.
- For questions and support, please visit our [Discord channel](https://discord.gg/G7Qnnhy).
- To dive deeper and get more hands-on experience, check out our official video [courses](https://courses.nestjs.com/).
- Deploy your application to AWS with the help of [NestJS Mau](https://mau.nestjs.com) in just a few clicks.
- Visualize your application graph and interact with the NestJS application in real-time using [NestJS Devtools](https://devtools.nestjs.com).
- Need help with your project (part-time to full-time)? Check out our official [enterprise support](https://enterprise.nestjs.com).
- To stay in the loop and get updates, follow us on [X](https://x.com/nestframework) and [LinkedIn](https://linkedin.com/company/nestjs).
- Looking for a job, or have a job to offer? Check out our official [Jobs board](https://jobs.nestjs.com).
