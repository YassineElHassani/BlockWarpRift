# BlockWarpRift

BlockWarpRift is a full-stack cryptocurrency payment gateway. Merchants can create payment requests that generate QR codes linked to their on-chain wallet address. A blockchain listener monitors incoming Ethereum transactions, tracks confirmation counts, and updates payment statuses in real time via WebSocket.

## Architecture

```
BlockWarpRift/
├── backend/          NestJS REST API + WebSocket server
├── frontend/         Next.js merchant dashboard and public payment pages
├── UML/              Class and use-case diagrams
└── docker-compose.yaml
```

The system is composed of five Docker services:

| Service        | Image             | Port  | Purpose                          |
|----------------|-------------------|-------|----------------------------------|
| mongodb        | mongo:7           | 27017 | Primary database                 |
| mongo-express  | mongo-express     | 8081  | Database admin UI                |
| redis          | redis:7-alpine    | 6379  | Caching and session store        |
| backend        | ./backend         | 3000  | NestJS API                       |
| frontend       | ./frontend        | 3001  | Next.js merchant dashboard       |

## Prerequisites

- Docker and Docker Compose
- An Ethereum RPC endpoint (e.g. Alchemy Sepolia)
- Node.js 22+ (for local development without Docker)

## Environment Setup

Create a `.env` file at the project root before running Docker Compose:

```env
# Application
PORT=3000
NODE_ENV=production

# MongoDB
MONGODB_URI=mongodb://mongodb:27017/blockwarprift

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d

# Encryption
ENCRYPTION_KEY=your-32-byte-hex-encryption-key

# Blockchain
RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_API_KEY
NETWORK=sepolia

# Redis
REDIS_URL=redis://redis:6379

# Mongo Express
ME_USERNAME=admin
ME_PASSWORD=securepassword

# Frontend
NEXT_PUBLIC_API_URL=http://localhost:3000
```

## Running with Docker Compose

```bash
# Build and start all services
docker-compose up --build -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down
```

After startup:
- API is available at `http://localhost:3000`
- Frontend is available at `http://localhost:3001`
- Mongo Express is available at `http://localhost:8081`

## Running Locally (Development)

```bash
# Backend
cd backend
npm install
npm run start:dev

# Frontend (in a separate terminal)
cd frontend
npm install
npm run dev
```

## CI/CD

A GitHub Actions pipeline runs on every push and pull request:

- **backend-lint**: ESLint check on all TypeScript source files
- **backend-test**: Unit and E2E test suite
- **backend-build**: Production NestJS build
- **frontend-lint**: ESLint check on all frontend source files
- **frontend-test**: Vitest unit test suite
- **frontend-build**: Next.js production build
- **docker-publish**: Builds and pushes Docker images on merge to `main`

## User Roles

| Role     | Access                                                    |
|----------|-----------------------------------------------------------|
| MERCHANT | Create payments, view own transactions, analytics         |
| ADMIN    | All merchant access plus user management and global data  |

## Tech Stack

| Layer      | Technology                                          |
|------------|-----------------------------------------------------|
| API        | NestJS 11, TypeScript, Passport JWT, Helmet         |
| Database   | MongoDB 7 (Mongoose), Redis 7                       |
| Blockchain | ethers.js 6, Alchemy Transfers API                  |
| Realtime   | Socket.IO (NestJS WebSockets)                       |
| Frontend   | Next.js 16, React 19, Zustand, Framer Motion, GSAP  |
| Testing    | Jest (backend), Vitest + Testing Library (frontend) |
