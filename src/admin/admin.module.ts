import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { TransactionsModule } from '../transactions/transactions.module';

@Module({
  controllers: [AdminController],
  imports: [
    TransactionsModule,
  ],
})
export class AdminModule {}
