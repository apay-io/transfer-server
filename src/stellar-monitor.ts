import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from 'nestjs-config';
import { StellarService } from './wallets/stellar.service';
import { TransactionsController } from './transactions/transactions.controller';
import { TransactionType } from './transactions/enums/transaction-type.enum';
import { HttpService } from '@nestjs/common';
import { RedisService } from 'nestjs-redis';
import { TransactionsService } from './transactions/transactions.service';

/**
 * Separate process, that sends notifications about incoming txns
 */
async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const configService = app.get<ConfigService>(ConfigService);
  const stellarService = app.get<StellarService>(StellarService);
  const txController = app.get<TransactionsController>(TransactionsController);
  const txService = app.get<TransactionsService>(TransactionsService);
  const httpService = app.get<HttpService>(HttpService);
  const redisService = app.get<RedisService>(RedisService);

  const allAssets = configService.get('assets').raw;

  for (const asset of allAssets) {
    // not a perfect solution as some trustlines might still get skipped, but good enough for now
    setInterval(async () => {
      const redisClient = redisService.getClient();

      const cursor = await redisClient.get(`${process.env.NODE_ENV}:trustlines:${asset.code}`);
      const result = await httpService
        .get(`${asset.horizonUrl}/accounts?asset=${asset.code}:${asset.stellar.issuer}` + (cursor ? `&cursor=${cursor}` : ``))
        .toPromise();
      if (result.data._embedded.records.length > 0) {
        const trustlines = result.data._embedded.records.map((item) => {
          return item.account_id;
        });
        const pendingTxns = await txService.findPendingTrustline(asset.code, trustlines);
        for (const tx of pendingTxns) {
          await txController.notify(asset.code, configService.get('app').notificationSecrets[0], {
            asset: asset.code,
            type: tx.type,
            hash: tx.txIn,
          });
        }
        const newCursor = result.data._embedded.records[result.data._embedded.records.length - 1].paging_token;
        await redisClient.set(`${process.env.NODE_ENV}:trustlines:${asset.code}`, newCursor);
      }
    }, 50000 + 20000 * Math.random());

  }

  for (const asset of allAssets) {
    await stellarService.listenToPayments(asset, async (op) => {
      // calling it directly right now, can be http request
      await txController.notify('xlm', configService.get('app').notificationSecrets[0], {
        asset: op.asset_code,
        type: TransactionType.withdrawal,
        hash: op.transaction_hash,
      });
    });
  }
}

bootstrap();
