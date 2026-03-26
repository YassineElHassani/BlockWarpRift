import * as QRCode from 'qrcode';
import { Currency } from '../common/constants';

export async function generateEIP681QR(
  walletAddress: string,
  _amount: string,
  _currency: Currency,
): Promise<string> {
  return QRCode.toDataURL(walletAddress);
}
