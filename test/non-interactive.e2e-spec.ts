import request from 'supertest';
import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { BitgoDriver } from '../src/wallets/drivers/bitgo.driver';
import { WalletFactoryService } from '../src/wallets/wallet-factory.service';
import { AppModule } from '../src/app.module';
import { TransactionType } from '../src/transactions/enums/transaction-type.enum';
import { StellarService } from '../src/wallets/stellar.service';

const BitgoDriverMock = jest.fn(() => ({
  getNewAddress: () => '',
  isValidDestination: () => true,
}));


describe('NonInteractiveController (e2e)', () => {
  let app: INestApplication;
  let bitgoDriver;
  let stellarService;
  const WalletFactoryServiceMock = jest.fn(() => ({
    get: (type) => {
      return type === TransactionType.deposit
        ? { walletIn: bitgoDriver, walletOut: stellarService }
        : { walletIn: stellarService, walletOut: bitgoDriver };
    },
  }));

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [
        AppModule,
      ],
    })
      .overrideProvider(BitgoDriver)
      .useClass(BitgoDriverMock)
      .overrideProvider(WalletFactoryService)
      .useClass(WalletFactoryServiceMock)
      .compile();

    app = module.createNestApplication();
    bitgoDriver = app.get<BitgoDriver>(BitgoDriver);
    stellarService = app.get<StellarService>(StellarService);
    app.useGlobalPipes(new ValidationPipe());
    await app.init();
  });

  it(`POST /transactions/deposit/non-interactive correct`, () => {
    return request(app.getHttpServer())
      .post('/transactions/deposit/non-interactive')
      .send({
        asset_code: 'TEST',
        account: 'GAY5RGI5K3EAZFKV4JRDKU4I3HADEGIVWNYIS34DMUMCKZGG4HFWXZXV',
      })
      .expect(201);
  });

  it(`POST /transactions/deposit/non-interactive missin paramg`, () => {
    return request(app.getHttpServer())
      .post('/transactions/deposit/non-interactive')
      .send({
        asset_code: 'TEST',
      })
      .expect(400);
  });

  it(`POST /transactions/deposit/non-interactive memo should not exist if memo_type=none`, () => {
    return request(app.getHttpServer())
      .post('/transactions/deposit/non-interactive')
      .send({
        asset_code: 'TEST',
        account: 'GAY5RGI5K3EAZFKV4JRDKU4I3HADEGIVWNYIS34DMUMCKZGG4HFWXZXV',
        memo_type: 'none',
        memo: 'TEST',
      })
      .expect(400);
  });

  it(`POST /transactions/deposit/non-interactive memo should exist if memo_type != none`, () => {
    return request(app.getHttpServer())
      .post('/transactions/deposit/non-interactive')
      .send({
        asset_code: 'TEST',
        account: 'GAY5RGI5K3EAZFKV4JRDKU4I3HADEGIVWNYIS34DMUMCKZGG4HFWXZXV',
        memo_type: 'id',
      })
      .expect(400);
  });

  it(`POST /transactions/deposit/non-interactive memo ID incorrect`, () => {
    return request(app.getHttpServer())
      .post('/transactions/deposit/non-interactive')
      .send({
        asset_code: 'TEST',
        account: 'GAY5RGI5K3EAZFKV4JRDKU4I3HADEGIVWNYIS34DMUMCKZGG4HFWXZXV',
        memo_type: 'id',
        memo: 'asd',
      })
      .expect(400);
  });

  it(`POST /transactions/deposit/non-interactive memo ID correct`, () => {
    return request(app.getHttpServer())
      .post('/transactions/deposit/non-interactive')
      .send({
        asset_code: 'TEST',
        account: 'GAY5RGI5K3EAZFKV4JRDKU4I3HADEGIVWNYIS34DMUMCKZGG4HFWXZXV',
        memo_type: 'id',
        memo: 123,
      })
      .expect(201);
  });

  it(`POST /transactions/deposit/non-interactive memo TEXT correct`, () => {
    return request(app.getHttpServer())
      .post('/transactions/deposit/non-interactive')
      .send({
        asset_code: 'TEST',
        account: 'GAY5RGI5K3EAZFKV4JRDKU4I3HADEGIVWNYIS34DMUMCKZGG4HFWXZXV',
        memo_type: 'text',
        memo: '',
      })
      .expect(201);
  });
  // todo: test to check memo is getting trimmed

  it(`POST /transactions/deposit/non-interactive memo TEXT incorrect`, () => {
    return request(app.getHttpServer())
      .post('/transactions/deposit/non-interactive')
      .send({
        asset_code: 'TEST',
        account: 'GAY5RGI5K3EAZFKV4JRDKU4I3HADEGIVWNYIS34DMUMCKZGG4HFWXZXV',
        memo_type: 'text',
        memo: '123456789012345678901234567890',
      })
      .expect(400);
  });

  it(`POST /transactions/deposit/non-interactive memo TEXT correct 2`, () => {
    return request(app.getHttpServer())
      .post('/transactions/deposit/non-interactive')
      .send({
        asset_code: 'TEST',
        account: 'GAY5RGI5K3EAZFKV4JRDKU4I3HADEGIVWNYIS34DMUMCKZGG4HFWXZXV',
        memo_type: 'text',
        memo: '1234567890123456789012345678',
      })
      .expect(201);
  });

  it(`POST /transactions/deposit/non-interactive memo HASH incorrect`, () => {
    return request(app.getHttpServer())
      .post('/transactions/deposit/non-interactive')
      .send({
        asset_code: 'TEST',
        account: 'GAY5RGI5K3EAZFKV4JRDKU4I3HADEGIVWNYIS34DMUMCKZGG4HFWXZXV',
        memo_type: 'hash',
        memo: 'd8a928b2043db77e340b523547bf16cb4aa483f0645fe0a290ed1f20aab7625',
      })
      .expect(400);
  });

  it(`POST /transactions/deposit/non-interactive memo HASH correct`, () => {
    return request(app.getHttpServer())
      .post('/transactions/deposit/non-interactive')
      .send({
        asset_code: 'TEST',
        account: 'GAY5RGI5K3EAZFKV4JRDKU4I3HADEGIVWNYIS34DMUMCKZGG4HFWXZXV',
        memo_type: 'hash',
        memo: 'd8a928b2043db77e340b523547bf16cb4aa483f0645fe0a290ed1f20aab76257',
      })
      .expect(201);
  });

  it(`POST /transactions/deposit/non-interactive memo RETURN incorrect`, () => {
    return request(app.getHttpServer())
      .post('/transactions/deposit/non-interactive')
      .send({
        asset_code: 'TEST',
        account: 'GAY5RGI5K3EAZFKV4JRDKU4I3HADEGIVWNYIS34DMUMCKZGG4HFWXZXV',
        memo_type: 'return',
        memo: '1234567890123456789012345678',
      })
      .expect(400);
  });

  it(`POST /transactions/deposit/non-interactive memo RETURN correct`, () => {
    return request(app.getHttpServer())
      .post('/transactions/deposit/non-interactive')
      .send({
        asset_code: 'TEST',
        account: 'GAY5RGI5K3EAZFKV4JRDKU4I3HADEGIVWNYIS34DMUMCKZGG4HFWXZXV',
        memo_type: 'return',
        memo: 'd8a928b2043db77e340b523547bf16cb4aa483f0645fe0a290ed1f20aab76257',
      })
      .expect(201);
  });

  it(`POST /transactions/withdraw/non-interactive correct params`, () => {
    return request(app.getHttpServer())
      .post('/transactions/withdraw/non-interactive')
      .send({
        asset_code: 'TBTC',
        dest: 'tb1qtpdvsyqxr8ky3n33gnme048q6jcnsusym7q2kkhmzw5xs3kv9p6suanya5',
        type: 'crypto',
      })
      .expect(201);
  });

  it(`POST /transactions/withdraw/non-interactive missing type`, () => {
    return request(app.getHttpServer())
      .post('/transactions/withdraw/non-interactive')
      .send({
        asset_code: 'TEST',
        dest: 'tb1qtpdvsyqxr8ky3n33gnme048q6jcnsusym7q2kkhmzw5xs3kv9p6suanya5',
      })
      .expect(400);
  });

  it(`POST /transactions/withdraw/non-interactive missing asset_code`, () => {
    return request(app.getHttpServer())
      .post('/transactions/withdraw/non-interactive')
      .send({
        dest: 'tb1qtpdvsyqxr8ky3n33gnme048q6jcnsusym7q2kkhmzw5xs3kv9p6suanya5',
        type: 'crypto',
      })
      .expect(400);
  });

  it(`POST /transactions/withdraw/non-interactive missing dest`, () => {
    return request(app.getHttpServer())
      .post('/transactions/withdraw/non-interactive')
      .send({
        asset_code: 'TEST',
        type: 'crypto',
      })
      .expect(400);
  });

  afterAll(async () => {
    await app.close();
  });
});
