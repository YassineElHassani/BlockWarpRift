import * as QRCode from 'qrcode';
import { ethers } from 'ethers';
import {
  Currency,
  SEPOLIA_CHAIN_ID,
} from '../common/constants';

export async function generateEIP681QR(
  walletAddress: string,
  amount: string,
  currency: Currency,
): Promise<string> {
  const amountInWei = ethers.parseEther(amount).toString();
  const uri = `ethereum:${walletAddress}@${SEPOLIA_CHAIN_ID}?value=${amountInWei}`;
  return QRCode.toDataURL(uri);
}
