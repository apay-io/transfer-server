import * as request from 'supertest';
import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigModule } from 'nestjs-config';
import * as path from 'path';
import { NonInteractiveModule } from '../src/non-interactive/non-interactive.module';

describe('NonInteractiveController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [
        ConfigModule.load(
          path.resolve(__dirname, 'config/**/!(*.d).{ts,js}'),
          {path: process.cwd() + '/' + (process.env.NODE_ENV || '') + '.env'},
        ),
        NonInteractiveModule,
      ],
    })
      .compile();

    app = module.createNestApplication();
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

  it(`POST /transactions/deposit/non-interactive missing`, () => {
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
        memo_type: 'NONE',
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
        memo_type: 'ID',
      })
      .expect(400);
  });

  it(`POST /transactions/deposit/non-interactive memo ID incorrect`, () => {
    return request(app.getHttpServer())
      .post('/transactions/deposit/non-interactive')
      .send({
        asset_code: 'TEST',
        account: 'GAY5RGI5K3EAZFKV4JRDKU4I3HADEGIVWNYIS34DMUMCKZGG4HFWXZXV',
        memo_type: 'ID',
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
        memo_type: 'ID',
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
        memo_type: 'TEXT',
        memo: '',
      })
      .expect(201);
  });

  it(`POST /transactions/deposit/non-interactive memo TEXT incorrect`, () => {
    return request(app.getHttpServer())
      .post('/transactions/deposit/non-interactive')
      .send({
        asset_code: 'TEST',
        account: 'GAY5RGI5K3EAZFKV4JRDKU4I3HADEGIVWNYIS34DMUMCKZGG4HFWXZXV',
        memo_type: 'TEXT',
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
        memo_type: 'TEXT',
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
        memo_type: 'HASH',
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
        memo_type: 'HASH',
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
        memo_type: 'RETURN',
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
        memo_type: 'RETURN',
        memo: 'd8a928b2043db77e340b523547bf16cb4aa483f0645fe0a290ed1f20aab76257',
      })
      .expect(201);
  });

  afterAll(async () => {
    await app.close();
  });
});
