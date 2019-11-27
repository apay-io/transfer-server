import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule, ConfigService } from 'nestjs-config';
import * as path from 'path';
import { TransactionsController } from './transactions.controller';
import { TransactionsService } from './transactions.service';
import { TransactionsFilterDto } from './dto/transactions-filter.dto';
import { TransactionType } from './enums/transaction-type.enum';
import { TransactionState } from './enums/transaction-state.enum';
import { TransactionFilterDto } from './dto/transaction-filter.dto';

const mockService = jest.fn(() => ({
  find: () => [],
  findOne: () => null,
}));

describe('TransacionsController', () => {
  let txsController: TransactionsController;
  let txsService: TransactionsService;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [TransactionsController],
      imports: [
        ConfigModule.load(
          path.resolve(__dirname, 'config/**/!(*.d).{ts,js}'),
          {path: process.cwd() + '/' + (process.env.NODE_ENV || '') + '.env'},
        ),
      ],
      providers: [
        { provide: TransactionsService, useClass: mockService },
      ],
    }).compile();

    txsController = app.get<TransactionsController>(TransactionsController);
    txsService = app.get<TransactionsService>(TransactionsService);
  });

  describe('/transactions', () => {
    it('should return empty array if no matching txs', async () => {
      const spy = spyOn(txsService, 'find').and.returnValue([]);

      expect(await txsController.getTransactions({
        asset_code: 'TEST',
        account: 'GAY5RGI5K3EAZFKV4JRDKU4I3HADEGIVWNYIS34DMUMCKZGG4HFWXZXV',
      } as TransactionsFilterDto)).toStrictEqual({ transactions: []});
      expect(spy.calls.count()).toBe(1);
    });

    it('should map data correctly', async () => {
      const spy = spyOn(txsService, 'find').and.returnValue([{
        id: 1,
        uuid: '730fbf44-aa56-427b-97c1-12f05408225d',
        type: TransactionType.deposit,
        state: TransactionState.incomplete,
      }]);
      expect(await txsController.getTransactions({
        asset_code: 'TEST',
        account: 'GAY5RGI5K3EAZFKV4JRDKU4I3HADEGIVWNYIS34DMUMCKZGG4HFWXZXV',
      } as TransactionsFilterDto)).toStrictEqual({ transactions: [{
        id: '730fbf44-aa56-427b-97c1-12f05408225d',
        kind: 'deposit',
        status: 'incomplete',
      }]});
      expect(spy.calls.count()).toBe(1);
    });
  });

  describe('/transaction', () => {
    it('should return 404 no matching tx', async () => {
      const spy = spyOn(txsService, 'findOne').and.returnValue(null);

      const response = {
        status: () => null,
      };
      const spy2 = spyOn(response, 'status').and.returnValue(null);

      expect(await txsController.getTransaction({
        id: '730fbf44-aa56-427b-97c1-12f054082251',
      } as TransactionFilterDto, response)).toBeFalsy();
      expect(spy.calls.count()).toBe(1);
      expect(spy2.calls.argsFor(0)).toStrictEqual([404]);
    });

    it('should map data correctly', async () => {
      const spy = spyOn(txsService, 'findOne').and.returnValue({
        id: 1,
        uuid: '730fbf44-aa56-427b-97c1-12f05408225d',
        type: TransactionType.deposit,
        state: TransactionState.incomplete,
      });
      const response = {
        status: () => null,
      };
      const spy2 = spyOn(response, 'status').and.returnValue(null);

      expect(await txsController.getTransaction({
        id: '730fbf44-aa56-427b-97c1-12f05408225d',
      } as TransactionFilterDto, response)).toStrictEqual({ transaction: {
        id: '730fbf44-aa56-427b-97c1-12f05408225d',
        kind: 'deposit',
        status: 'incomplete',
      }});
      expect(spy.calls.count()).toBe(1);
      expect(spy2.calls.count()).toBe(0);
    });
  });
});
