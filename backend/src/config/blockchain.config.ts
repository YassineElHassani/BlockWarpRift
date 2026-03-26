import { ConfigService } from '@nestjs/config';
import { ethers } from 'ethers';

export function createProvider(
  configService: ConfigService,
): ethers.JsonRpcProvider {
  const rpcUrl = configService.get<string>('blockchain.rpcUrl', '');
  return new ethers.JsonRpcProvider(rpcUrl);
}
