import { Module } from '@nestjs/common';
import { Transaction } from './transaction.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TransactionsController } from './transactions.controller';
import { TransactionsService } from './transactions.service';
import { TempTransaction } from './temp-transaction.entity';
import { TempTransactionsService } from './temp-transactions.service';

@Module({
  controllers: [
    TransactionsController,
  ],
  imports: [
    TypeOrmModule.forFeature([TempTransaction, Transaction]),
  ],
  providers: [
    TempTransactionsService,
    TransactionsService,
  ],
})
export class TransactionsModule {
}
