# BlockWarpRift Frontend

Next.js merchant dashboard and public-facing payment pages for the BlockWarpRift cryptocurrency payment gateway.

## Tech Stack

- Next.js 16 (App Router), React 19, TypeScript
- Zustand for auth state management
- Framer Motion and GSAP for animations
- Tailwind CSS with shadcn/ui components
- ethers.js 6 and MetaMask for wallet connection
- Socket.IO client for real-time payment updates
- Vitest and Testing Library for unit tests

## Project Structure

```
app/
├── (auth)/            Login and register pages
├── (public)/          Marketing landing, solutions, developers
├── admin/             Admin dashboard, user management, global transactions
├── dashboard/         Merchant dashboard, payments, transactions, analytics
├── payment/           Public payment request pages
└── transaction/       Transaction detail page

components/
├── layout/            Navbar, DashboardSidebar, DashboardShell, RoleGuard
└── ui/                shadcn/ui components + custom hero component

hooks/
├── useMetaMask.ts     MetaMask connect, disconnect, reconnect
└── useSocket.ts       Socket.IO payment subscription hooks

services/
└── api.ts             Axios client for all backend API calls

store/
└── auth.store.ts      Zustand auth store with hydration from localStorage

types/
└── index.ts           Shared TypeScript types

__tests__/             Vitest unit tests
```

## Environment Variables

Create a `.env.local` file in the `frontend/` directory:

```env
NEXT_PUBLIC_API_URL=http://localhost:3000
```

## Installation

```bash
npm install
```

## Running

```bash
# Development server (http://localhost:3000)
npm run dev

# Production build
npm run build
npm run start
```

## Linting

```bash
npm run lint
```

## Testing

```bash
# Run all unit tests once
npm run test

# Run in watch mode
npm run test:watch
```

Tests cover:
- `lib/utils.ts` — Tailwind class merging utility
- `store/auth.store.ts` — Zustand auth store actions and persistence
- `payments/payment.helpers` — Payment status display logic

## Application Routes

| Path                      | Access      | Description                          |
|---------------------------|-------------|--------------------------------------|
| /                         | Public      | Landing page                         |
| /login                    | Public      | Merchant / admin login               |
| /register                 | Public      | Merchant registration                |
| /dashboard                | MERCHANT    | Overview cards and stats             |
| /dashboard/payments       | MERCHANT    | Payment request list with pagination |
| /dashboard/transactions   | MERCHANT    | Transaction history                  |
| /dashboard/analytics      | MERCHANT    | Revenue and payment analytics        |
| /admin/dashboard          | ADMIN       | Admin overview                       |
| /admin/users              | ADMIN       | User management                      |
| /admin/transactions       | ADMIN       | Global transaction list              |
| /payment/:id              | Public      | Customer-facing payment QR page      |
| /unauthorized             | Public      | Role access denied page              |

## Authentication Flow

1. User logs in via `/login`. The API returns a JWT and user object.
2. The Zustand store persists the token and user in `localStorage`.
3. `RoleGuard` wraps protected routes and redirects unauthenticated users to `/login` or `/unauthorized` based on role.
4. The Axios client reads the token from the store and attaches it as a `Bearer` header on every request.

## MetaMask Integration

Merchants connect their Ethereum wallet from the payments page. The `useMetaMask` hook handles:

- `connect()` — Requests wallet accounts via `eth_requestAccounts`
- `disconnect()` — Clears the connected account from local state
- `reconnect()` — Re-requests accounts to switch wallet or reconnect

User rejections (error code `4001`) are silently ignored.

## Real-Time Updates

The `useSocket` hook subscribes to a Socket.IO room identified by the payment ID. Incoming `payment.updated` and `payment.confirmed` events update the UI without requiring a page refresh.
