import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { WalletService } from './wallet.service';
import { Wallet, WalletSchema } from './schemas/wallet.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Wallet.name, schema: WalletSchema }]),
    ConfigModule,
  ],
  providers: [WalletService],
  exports: [WalletService],
})
export class WalletModule {}
