import { Controller, Get, UseGuards } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { JwtGuard } from '../../common/guards/jwt.guard';
import { CurrentUser } from '../../common/decorators/user.decorator';

@UseGuards(JwtGuard)
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('revenue')
  getRevenue(@CurrentUser() user: { userId: string }) {
    return this.analyticsService.getRevenue(user.userId);
  }

  @Get('transactions')
  getTransactionStats(@CurrentUser() user: { userId: string }) {
    return this.analyticsService.getTransactionStats(user.userId);
  }

  @Get('payments')
  getPaymentStats(@CurrentUser() user: { userId: string }) {
    return this.analyticsService.getPaymentStats(user.userId);
  }
}
