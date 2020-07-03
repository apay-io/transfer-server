import { Module } from '@nestjs/common';
import { InteractiveController } from './interactive.controller';
import { NonInteractiveModule } from '../non-interactive/non-interactive.module';
import { TransactionsModule } from '../transactions/transactions.module';
import { KycModule } from '../kyc/kyc.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './user.entity';
import { UserService } from './user.service';
import { Account } from './account.entity';

@Module({
  controllers: [InteractiveController],
  imports: [
    KycModule,
    NonInteractiveModule,
    TransactionsModule,
    TypeOrmModule.forFeature([Account, User]),
  ],
  providers: [UserService]
})
export class InteractiveModule {}
