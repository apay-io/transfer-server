import { Test, TestingModule } from '@nestjs/testing';
import { TransactionsController } from './transactions.controller';
import { TransactionsService } from './transactions.service';
import { TransactionsFilterDto } from './dto/transactions-filter.dto';
import { TransactionType } from './enums/transaction-type.enum';
import { TransactionState } from './enums/transaction-state.enum';
import { TransactionFilterDto } from './dto/transaction-filter.dto';
import { TempTransactionsService } from './temp-transactions.service';
import { QueuesModule } from '../queues/queues.module';
import { ConfigModule } from '@nestjs/config';
import { BigNumber } from 'bignumber.js';

const mockService = jest.fn(() => ({
  find: () => [],
  findOne: () => null,
  getTxById: () => null,
}));
const mockTempService = jest.fn(() => ({
  find: () => [],
  getTxById: () => null,
  save: (chain, dto) => dto,
}));

describe('TransactionsController', () => {
  let txsController: TransactionsController;
  let txsService: TransactionsService;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [TransactionsController],
      imports: [
        ConfigModule.forRoot({
          envFilePath: [process.cwd() + '/' + (process.env.NODE_ENV || '') + '.env'],
        }),
        QueuesModule,
      ],
      providers: [
        { provide: TransactionsService, useClass: mockService },
        { provide: TempTransactionsService, useClass: mockTempService },
      ],
    }).compile();

    txsController = app.get<TransactionsController>(TransactionsController);
    txsService = app.get<TransactionsService>(TransactionsService);
  });

  describe('/transactions', () => {
    it('should fail for invalid parameters', async () => {
      const spy = spyOn(txsService, 'find').and.returnValue([]);

      await expect(txsController.getTransactionsSep6({
        asset_code: 'TEST',
      } as TransactionsFilterDto)).rejects.toThrow();
      expect(spy.calls.count()).toBe(0);
    });

    it('should return empty array if no matching txs', async () => {
      const spy = spyOn(txsService, 'find').and.returnValue([]);

      expect(await txsController.getTransactions({
        user: { sub: 'GAY5RGI5K3EAZFKV4JRDKU4I3HADEGIVWNYIS34DMUMCKZGG4HFWXZXV' }
      }, {
        asset_code: 'TEST',
      } as TransactionsFilterDto)).toStrictEqual({ transactions: []});
      expect(spy.calls.count()).toBe(1);
    });

    it('should map data correctly', async () => {
      const spy = spyOn(txsService, 'find').and.returnValue([{
        id: 1,
        uuid: '730fbf44-aa56-427b-97c1-12f05408225d',
        type: TransactionType.deposit,
        state: TransactionState.incomplete,
        amountIn: new BigNumber(0),
        amountOut: new BigNumber(0),
        amountFee: new BigNumber(0),
        logs: [],
      }]);
      expect(await txsController.getTransactions({
        user: { sub: 'GAY5RGI5K3EAZFKV4JRDKU4I3HADEGIVWNYIS34DMUMCKZGG4HFWXZXV' }
      }, {
        asset_code: 'TEST',
        account: 'GAY5RGI5K3EAZFKV4JRDKU4I3HADEGIVWNYIS34DMUMCKZGG4HFWXZXV',
      } as TransactionsFilterDto)).toMatchObject({ transactions: [{
        id: '730fbf44-aa56-427b-97c1-12f05408225d',
        kind: 'deposit',
        status: 'incomplete',
      }]});
      expect(spy.calls.count()).toBe(1);
    });
  });

  describe('/transaction', () => {
    it('should return 400 invalid params', async () => {
      const response = {
        status: () => null,
        send: () => null,
      };
      const spy2 = spyOn(response, 'status').and.returnValue(response);

      expect(await txsController.getTransactionSep6({} as TransactionFilterDto, response)).toBeFalsy();
      expect(spy2.calls.argsFor(0)).toStrictEqual([400]);
    });

    it('should return 404 no matching tx', async () => {
      const spy = spyOn(txsService, 'getTxById').and.returnValue(null);

      await expect(txsController.getTransaction({
        user: { sub: 'GAY5RGI5K3EAZFKV4JRDKU4I3HADEGIVWNYIS34DMUMCKZGG4HFWXZXV' }
      }, {
        id: '730fbf44-aa56-427b-97c1-12f054082251',
      } as TransactionFilterDto)).rejects.toThrow();
      expect(spy.calls.count()).toBe(1);
    });

    it('should map data correctly', async () => {
      const spy = spyOn(txsService, 'getTxById').and.returnValue({
        id: 1,
        uuid: '730fbf44-aa56-427b-97c1-12f05408225d',
        type: TransactionType.deposit,
        state: TransactionState.incomplete,
        amountIn: new BigNumber(0),
        amountOut: new BigNumber(0),
        amountFee: new BigNumber(0),
        logs: [],
      });

      expect(await txsController.getTransaction({
        user: { sub: 'GAY5RGI5K3EAZFKV4JRDKU4I3HADEGIVWNYIS34DMUMCKZGG4HFWXZXV' }
      }, {
        id: '730fbf44-aa56-427b-97c1-12f05408225d',
      } as TransactionFilterDto)).toMatchObject({ transaction: {
        id: '730fbf44-aa56-427b-97c1-12f05408225d',
        kind: 'deposit',
        status: 'incomplete',
      }});
      expect(spy.calls.count()).toBe(1);
    });
  });
});
