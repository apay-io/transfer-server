import { Test, TestingModule } from '@nestjs/testing';
import { InteractiveController } from './interactive.controller';
import { TransactionsModule } from '../transactions/transactions.module';
import { getRepositoryToken, TypeOrmModule } from '@nestjs/typeorm';
import { TempTransaction } from '../transactions/temp-transaction.entity';
import { Transaction } from '../transactions/transaction.entity';
import { TransactionLog } from '../transactions/transaction-log.entity';
import { QueuesModule } from '../queues/queues.module';
import { TempTransactionsService } from '../transactions/temp-transactions.service';

describe('Interactive Controller', () => {
  let controller: InteractiveController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
      ],
      controllers: [InteractiveController],
      providers: [
        {
          provide: TempTransactionsService,
          useValue: {},
        },
      ]
    }).compile();

    controller = module.get<InteractiveController>(InteractiveController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
