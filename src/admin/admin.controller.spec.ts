import { Test, TestingModule } from '@nestjs/testing';
import { AdminController } from './admin.controller';
import { ConfigModule, ConfigService } from 'nestjs-config';
import * as path from 'path';
import { TransactionsService } from '../transactions/transactions.service';
import { QueuesModule } from '../queues/queues.module';

describe('Admin Controller', () => {
  let controller: AdminController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminController],
      imports: [
        ConfigModule.load(
          path.resolve(__dirname, 'config/**/!(*.d).{ts,js}'),
          {path: process.cwd() + '/' + (process.env.NODE_ENV || '') + '.env'},
        ),
        QueuesModule,
      ],
      providers: [
        { provide: ConfigService, useValue: { get: () => { return { url: '' } } } },
        { provide: TransactionsService, useValue: { find: () => [] } },
      ],
    })
      .compile();

    controller = module.get<AdminController>(AdminController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
