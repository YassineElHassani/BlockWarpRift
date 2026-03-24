import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { JwtGuard } from '../../common/guards/jwt.guard';
import { CurrentUser } from '../../common/decorators/user.decorator';

@Controller('payment')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @UseGuards(JwtGuard)
  @Post()
  create(
    @Body() createPaymentDto: CreatePaymentDto,
    @CurrentUser() user: { userId: string },
  ) {
    return this.paymentService.create(createPaymentDto, user.userId);
  }

  @UseGuards(JwtGuard)
  @Get()
  findAll(@CurrentUser() user: { userId: string }) {
    return this.paymentService.findAll(user.userId);
  }

  // Public endpoint — no auth required; must be before :id route
  @Get('public/:id')
  findPublic(@Param('id') id: string) {
    return this.paymentService.findPublic(id);
  }

  @UseGuards(JwtGuard)
  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: { userId: string }) {
    return this.paymentService.findOne(id, user.userId);
  }
}

