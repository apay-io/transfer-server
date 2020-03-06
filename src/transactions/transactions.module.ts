import { Module } from '@nestjs/common';
import { Transaction } from './transaction.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TransactionsController } from './transactions.controller';
import { TransactionsService } from './transactions.service';
import { TempTransaction } from './temp-transaction.entity';
import { TempTransactionsService } from './temp-transactions.service';
import { QueuesModule } from '../queues/queues.module';
import { WalletsModule } from '../wallets/wallets.module';
import { TempTransactionsProcessor } from './temp-transactions.processor';
import { NonInteractiveModule } from '../non-interactive/non-interactive.module';
import { UtilsModule } from '../utils/utils.module';
import { TransactionsProcessor } from './transactions.processor';
import { SignProcessor } from './sign.processor';
import { SubmitProcessor } from './submit.processor';
import { TransactionLog } from './transaction-log.entity';
import { TransactionLogsService } from './transaction-logs.service';
import { EventsGateway } from './events.gateway';

@Module({
  controllers: [
    TransactionsController,
  ],
  exports: [
    TransactionsService,
  ],
  imports: [
    NonInteractiveModule,
    TypeOrmModule.forFeature([TempTransaction, Transaction, TransactionLog]),
    QueuesModule,
    UtilsModule,
    WalletsModule,
  ],
  providers: [
    TempTransactionsService,
    TempTransactionsProcessor,
    TransactionsProcessor,
    SignProcessor,
    SubmitProcessor,
    TransactionsService,
    TransactionLogsService,
    EventsGateway,
  ],
})
export class TransactionsModule {
}
