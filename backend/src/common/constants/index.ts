export enum Currency {
  ETH = 'ETH',
  USDT = 'USDT',
  USDC = 'USDC',
}

export const SEPOLIA_CHAIN_ID = 11155111;

export const PAYMENT_EXPIRY_MINUTES = 15;

export const ERC20_TOKEN_CONTRACTS: Record<string, string> = {
  [Currency.USDT]: '0x7169D38820dfd117C3FA1f22a697dBA58d90BA06',
  [Currency.USDC]: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238',
};
