import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { TransactionService } from './transaction.service';
import { JwtGuard } from '../../common/guards/jwt.guard';
import { CurrentUser } from '../../common/decorators/user.decorator';

@UseGuards(JwtGuard)
@Controller('transaction')
export class TransactionController {
  constructor(private readonly transactionService: TransactionService) {}

  @Get(':paymentId')
  findByPaymentRequest(
    @Param('paymentId') paymentId: string,
    @CurrentUser() _user: { userId: string },
  ) {
    return this.transactionService.findByPaymentRequest(paymentId);
  }
}

