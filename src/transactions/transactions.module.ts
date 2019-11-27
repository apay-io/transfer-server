import { Module } from '@nestjs/common';
import { Transaction } from './transaction.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TransactionsController } from './transactions.controller';
import { TransactionsService } from './transactions.service';

@Module({
  controllers: [
    TransactionsController,
  ],
  imports: [
    TypeOrmModule.forFeature([Transaction]),
  ],
  providers: [
    TransactionsService,
  ],
})
export class TransactionsModule {
}
