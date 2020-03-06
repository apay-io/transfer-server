import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  WsResponse,
} from '@nestjs/websockets';
import { Server } from 'ws';
import { Injectable, Logger } from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { TransactionDto } from './dto/transaction.dto';
import { Transaction } from './transaction.entity';
import { TransactionType } from './enums/transaction-type.enum';

@Injectable()
@WebSocketGateway(8080)
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit {
  private readonly logger = new Logger(EventsGateway.name);

  private clients = {};
  private subscribers: {};

  constructor(
    private readonly txService: TransactionsService,
  ) {
  }

  @WebSocketServer()
  server: Server;

  afterInit() {
    this.logger.log('init');
  }

  handleConnection(client: any) {
    this.clients[client.id] = client;
    this.logger.log(`connected ${client.id}`);
  }

  handleDisconnect(client: any): any {
    delete this.clients[client.id];
    this.logger.log(`disconnected ${client.id}`);
  }

  @SubscribeMessage('events')
  onEvent(client: any, data: any): WsResponse<TransactionDto[]> {
    this.subscribers[data.addressIn] = client.id;
    return { event: 'events', data: [] };
  }

  send(tx: Transaction) {
    this.logger.log(tx);
    return this.clients[this.subscribers[tx.addressIn]].send({
      event: 'events',
      data: [{
        status: tx.state,
        kind: tx.type,
        external_transaction_id: tx.type === TransactionType.deposit ? tx.txIn : tx.txOut,
        to: tx.addressOut,
      }],
    });
  }
}
