import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';
import { PaymentModule } from './modules/payment/payment.module';
import { TransactionModule } from './modules/transaction/transaction.module';

@Module({
  imports: [UsersModule, AuthModule, PaymentModule, TransactionModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
