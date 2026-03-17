import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: { origin: '*' },
  namespace: '/',
})
export class PaymentGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(PaymentGateway.name);

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('subscribe_payment')
  handleSubscribePayment(
    @MessageBody() paymentId: string,
    @ConnectedSocket() client: Socket,
  ) {
    client.join(`payment:${paymentId}`);
    this.logger.log(`Client ${client.id} subscribed to payment:${paymentId}`);
  }

  @SubscribeMessage('unsubscribe_payment')
  handleUnsubscribePayment(
    @MessageBody() paymentId: string,
    @ConnectedSocket() client: Socket,
  ) {
    client.leave(`payment:${paymentId}`);
  }

  emitPaymentUpdated(paymentId: string, data: Record<string, unknown>): void {
    this.server.to(`payment:${paymentId}`).emit('payment.updated', {
      paymentId,
      ...data,
    });
    this.logger.log(`Emitted payment.updated for payment:${paymentId}`);
  }

  emitPaymentConfirmed(paymentId: string, data: Record<string, unknown>): void {
    this.server.to(`payment:${paymentId}`).emit('payment.confirmed', {
      paymentId,
      ...data,
    });
  }
}
