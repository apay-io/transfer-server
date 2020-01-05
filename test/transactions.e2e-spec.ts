import * as request from 'supertest';
import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { TransactionsService } from '../src/transactions/transactions.service';
import { TransactionsModule } from '../src/transactions/transactions.module';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Transaction } from '../src/transactions/transaction.entity';
import { ConfigModule } from 'nestjs-config';
import * as path from 'path';
import assets from '../src/config/assets';
import { TransactionState } from '../src/transactions/enums/transaction-state.enum';
import { TransactionType } from '../src/transactions/enums/transaction-type.enum';
import { TempTransactionsService } from '../src/transactions/temp-transactions.service';
import { TempTransaction } from '../src/transactions/temp-transaction.entity';
import { TransactionLog } from '../src/transactions/transaction-log.entity';
import { WithdrawalMappingService } from '../src/non-interactive/withdrawal-mapping.service';
import { WithdrawalMapping } from '../src/non-interactive/withdrawal-mapping.entity';
import { DepositMapping } from '../src/non-interactive/deposit-mapping.entity';

describe('TransactionsController (e2e) /GET transactions', () => {
  let app: INestApplication;
  const txsService = {
    find: () => [],
    findOne: () => null,
  };
  const tempTxsService = {
    save: () => {},
  };
  const withdrawalMappingService = {
    getWithdrawalMapping: () => {
      return {
        id: 123,
        addressIn: 'asd',
      };
    },
  };

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [
        ConfigModule.load(
          path.resolve(__dirname, 'config/**/!(*.d).{ts,js}'),
          {path: process.cwd() + '/' + (process.env.NODE_ENV || '') + '.env'},
        ),
        TransactionsModule,
      ],
    })
      .overrideProvider(getRepositoryToken(Transaction))
      .useValue({})
      .overrideProvider(getRepositoryToken(TransactionLog))
      .useValue({})
      .overrideProvider(getRepositoryToken(TempTransaction))
      .useValue({})
      .overrideProvider(getRepositoryToken(DepositMapping))
      .useValue({})
      .overrideProvider(getRepositoryToken(WithdrawalMapping))
      .useValue({})
      .overrideProvider(TransactionsService)
      .useValue(txsService)
      .overrideProvider(TempTransactionsService)
      .useValue(tempTxsService)
      .overrideProvider(WithdrawalMappingService)
      .useValue(withdrawalMappingService)
      .compile();

    app = module.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();
  });

  it(`GET /transactions empty`, () => {
    spyOn(txsService, 'find').and.returnValue([]);
    const issuer = assets.raw[0].stellar.issuer;

    return request(app.getHttpServer())
      .get('/transactions')
      .query({
        asset_code: 'TEST',
        account: 'GAY5RGI5K3EAZFKV4JRDKU4I3HADEGIVWNYIS34DMUMCKZGG4HFWXZXV',
        asset_issuer: issuer,
        limit: 10,
        no_older_than: '2020-01-01',
        kind: 'deposit',
        paging_id: '123',
      })
      .expect(200)
      .expect({ transactions: [] });
  });

  it(`GET /transactions missing asset code`, () => {
    spyOn(txsService, 'find').and.returnValue([]);

    return request(app.getHttpServer())
      .get('/transactions')
      .query({
        account: 'GAY5RGI5K3EAZFKV4JRDKU4I3HADEGIVWNYIS34DMUMCKZGG4HFWXZXV',
      })
      .expect(400);
  });

  it(`GET /transactions invalid asset`, () => {
    spyOn(txsService, 'find').and.returnValue([]);

    return request(app.getHttpServer())
      .get('/transactions')
      .query({
        asset_code: 'XXX',
        account: 'GAY5RGI5K3EAZFKV4JRDKU4I3HADEGIVWNYIS34DMUMCKZGG4HFWXZXV',
      })
      .expect(400);
  });

  it(`GET /transactions missing account`, () => {
    spyOn(txsService, 'find').and.returnValue([]);

    return request(app.getHttpServer())
      .get('/transactions')
      .query({
        asset_code: 'TEST',
      })
      .expect(400);
  });

  it(`GET /transactions invalid account`, () => {
    spyOn(txsService, 'find').and.returnValue([]);

    return request(app.getHttpServer())
      .get('/transactions')
      .query({
        asset_code: 'TEST',
        account: 'GAY5RGI5K3EAZFKV4JRDKU4I3HADEGIVWNYIS34DMUMCKZGG4HFWXZX',
      })
      .expect(400);
  });

  it(`GET /transactions invalid asset_issuer`, () => {
    spyOn(txsService, 'find').and.returnValue([]);

    return request(app.getHttpServer())
      .get('/transactions')
      .query({
        asset_code: 'TEST',
        account: 'GAY5RGI5K3EAZFKV4JRDKU4I3HADEGIVWNYIS34DMUMCKZGG4HFWXZXV',
        asset_issuer: 'GAY5RGI5K3EAZFKV4JRDKU4I3HADEGIVWNYIS34DMUMCKZGG4HFWXZX',
      })
      .expect(400);
  });

  it(`GET /transactions unknown asset_issuer`, () => {
    spyOn(txsService, 'find').and.returnValue([]);

    return request(app.getHttpServer())
      .get('/transactions')
      .query({
        asset_code: 'TEST',
        account: 'GAY5RGI5K3EAZFKV4JRDKU4I3HADEGIVWNYIS34DMUMCKZGG4HFWXZXV',
        asset_issuer: 'GAY5RGI5K3EAZFKV4JRDKU4I3HADEGIVWNYIS34DMUMCKZGG4HFWXZXV',
      })
      .expect(400);
  });

  it(`GET /transactions known asset_issuer`, () => {
    spyOn(txsService, 'find').and.returnValue([]);
    const issuer = assets.raw[0].stellar.issuer;

    return request(app.getHttpServer())
      .get('/transactions')
      .query({
        asset_code: 'TEST',
        account: 'GAY5RGI5K3EAZFKV4JRDKU4I3HADEGIVWNYIS34DMUMCKZGG4HFWXZXV',
        asset_issuer: issuer,
      })
      .expect(200);
  });

  it(`GET /transactions invalid no_older_than`, () => {
    spyOn(txsService, 'find').and.returnValue([]);

    return request(app.getHttpServer())
      .get('/transactions')
      .query({
        asset_code: 'TEST',
        account: 'GAY5RGI5K3EAZFKV4JRDKU4I3HADEGIVWNYIS34DMUMCKZGG4HFWXZXV',
        no_older_than: '01-10-2019',
      })
      .expect(400);
  });

  it(`GET /transactions invalid limit`, () => {
    spyOn(txsService, 'find').and.returnValue([]);

    return request(app.getHttpServer())
      .get('/transactions')
      .query({
        asset_code: 'TEST',
        account: 'GAY5RGI5K3EAZFKV4JRDKU4I3HADEGIVWNYIS34DMUMCKZGG4HFWXZXV',
        limit: null,
      })
      .expect(400);
  });

  it(`GET /transactions invalid limit2`, () => {
    spyOn(txsService, 'find').and.returnValue([]);

    return request(app.getHttpServer())
      .get('/transactions')
      .query({
        asset_code: 'TEST',
        account: 'GAY5RGI5K3EAZFKV4JRDKU4I3HADEGIVWNYIS34DMUMCKZGG4HFWXZXV',
        limit: -10,
      })
      .expect(400);
  });

  it(`GET /transactions invalid limit3`, () => {
    spyOn(txsService, 'find').and.returnValue([]);

    return request(app.getHttpServer())
      .get('/transactions')
      .query({
        asset_code: 'TEST',
        account: 'GAY5RGI5K3EAZFKV4JRDKU4I3HADEGIVWNYIS34DMUMCKZGG4HFWXZXV',
        limit: 1.2,
      })
      .expect(400);
  });

  it(`GET /transactions invalid kind`, () => {
    spyOn(txsService, 'find').and.returnValue([]);

    return request(app.getHttpServer())
      .get('/transactions')
      .query({
        asset_code: 'TEST',
        account: 'GAY5RGI5K3EAZFKV4JRDKU4I3HADEGIVWNYIS34DMUMCKZGG4HFWXZXV',
        kind: 'asdasfg',
      })
      .expect(400);
  });

  it(`GET /transactions invalid paging_id`, () => {
    spyOn(txsService, 'find').and.returnValue([]);

    return request(app.getHttpServer())
      .get('/transactions')
      .query({
        asset_code: 'TEST',
        account: 'GAY5RGI5K3EAZFKV4JRDKU4I3HADEGIVWNYIS34DMUMCKZGG4HFWXZXV',
        paging_id: 'asdasfg',
      })
      .expect(400);
  });

  xit(`GET /transaction valid`, () => {
    spyOn(txsService, 'findOne').and.returnValue(Promise.resolve({
      id: 1,
      uuid: '3021b5be-ab7e-4de0-b90a-8ac73ebc211b',
      type: TransactionType.deposit,
      state: TransactionState.incomplete,
    }));

    return request(app.getHttpServer())
      .get('/transaction')
      .query({
        id: '3021b5be-ab7e-4de0-b90a-8ac73ebc211b',
      })
      .expect(200)
      .expect({ transaction: {
        id: '3021b5be-ab7e-4de0-b90a-8ac73ebc211b',
        kind: 'deposit',
        status: 'incomplete',
      }});
  });

  it(`GET /transaction no params`, () => {
    spyOn(txsService, 'findOne').and.returnValue(Promise.resolve({
      id: 1,
      uuid: '3021b5be-ab7e-4de0-b90a-8ac73ebc211b',
      type: TransactionType.deposit,
      state: TransactionState.incomplete,
    }));

    return request(app.getHttpServer())
      .get('/transaction')
      .expect(400);
  });

  it(`GET /transaction invalid id`, () => {
    spyOn(txsService, 'findOne').and.returnValue(Promise.resolve({
      id: 1,
      uuid: '3021b5be-ab7e-4de0-b90a-8ac73ebc211b',
      type: TransactionType.deposit,
      state: TransactionState.incomplete,
    }));

    return request(app.getHttpServer())
      .get('/transaction')
      .query({
        id: 1,
      })
      .expect(400);
  });

  it(`GET /transaction invalid stellar_transaction_id`, () => {
    spyOn(txsService, 'findOne').and.returnValue(Promise.resolve({
      id: 1,
      uuid: '3021b5be-ab7e-4de0-b90a-8ac73ebc211b',
      type: TransactionType.deposit,
      state: TransactionState.incomplete,
    }));

    return request(app.getHttpServer())
      .get('/transaction')
      .query({
        stellar_transaction_id: '3021b5be-ab7e-4de0-b90a-8ac73ebc211b',
      })
      .expect(400);
  });

  it(`GET /transaction invalid external_transaction_id`, () => {
    spyOn(txsService, 'findOne').and.returnValue(Promise.resolve({
      id: 1,
      uuid: '3021b5be-ab7e-4de0-b90a-8ac73ebc211b',
      type: TransactionType.deposit,
      state: TransactionState.incomplete,
    }));

    return request(app.getHttpServer())
      .get('/transaction')
      .query({
        external_transaction_id: '3021b5be-ab7e-4de0-b90a-8ac73ebc211b',
      })
      .expect(400);
  });

  afterAll(async () => {
    await app.close();
  });
});
