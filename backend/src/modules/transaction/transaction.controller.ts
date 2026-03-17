import { Controller, Get, Param, Query, UseGuards, ParseIntPipe, DefaultValuePipe } from '@nestjs/common';
import { TransactionService } from './transaction.service';
import { JwtGuard } from '../../common/guards/jwt.guard';
import { CurrentUser } from '../../common/decorators/user.decorator';

@UseGuards(JwtGuard)
@Controller('transaction')
export class TransactionController {
  constructor(private readonly transactionService: TransactionService) {}

  @Get()
  findAll(
    @CurrentUser() user: { userId: string },
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    return this.transactionService.findAllByMerchant(user.userId, page, limit);
  }

  @Get(':paymentId')
  findByPaymentRequest(
    @Param('paymentId') paymentId: string,
    @CurrentUser() _user: { userId: string },
  ) {
    return this.transactionService.findByPaymentRequest(paymentId);
  }
}

