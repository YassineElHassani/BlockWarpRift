import { Module } from '@nestjs/common';
import { PaymentGateway } from './websocket.gateway';

@Module({
  providers: [PaymentGateway],
  exports: [PaymentGateway],
})
export class WebSocketModule {}
