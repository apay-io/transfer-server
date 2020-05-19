import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { TransactionsModule } from '../transactions/transactions.module';
import { QueuesModule } from '../queues/queues.module';

@Module({
  controllers: [AdminController],
  imports: [
    TransactionsModule,
    QueuesModule,
  ],
})
export class AdminModule {}
