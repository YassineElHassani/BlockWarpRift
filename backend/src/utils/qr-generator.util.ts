import * as QRCode from 'qrcode';
import { ethers } from 'ethers';
import { Currency, ERC20_TOKEN_CONTRACTS, SEPOLIA_CHAIN_ID } from '../common/constants';

export async function generateEIP681QR(
  walletAddress: string,
  amount: string,
  currency: Currency,
): Promise<string> {
  let uri: string;

  if (currency === Currency.ETH) {
    const amountInWei = ethers.parseEther(amount).toString();
    uri = `ethereum:${walletAddress}@${SEPOLIA_CHAIN_ID}?value=${amountInWei}`;
  } else {
    const tokenAddress = ERC20_TOKEN_CONTRACTS[currency];
    const amountInUnits = ethers.parseUnits(amount, 6).toString();
    uri = `ethereum:${tokenAddress}@${SEPOLIA_CHAIN_ID}/transfer?address=${walletAddress}&uint256=${amountInUnits}`;
  }

  return QRCode.toDataURL(uri);
}
