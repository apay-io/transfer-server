import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from 'nestjs-config';
import { StellarService } from './wallets/stellar.service';
import { TransactionsController } from './transactions/transactions.controller';
import { TransactionType } from './transactions/enums/transaction-type.enum';

/**
 * Separate process, that sends notifications about incoming txns
 */
async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const configService = app.get<ConfigService>(ConfigService);
  const stellarService = app.get<StellarService>(StellarService);
  const txController = app.get<TransactionsController>(TransactionsController);

  const allAssets = configService.get('assets').raw;

  for (const assetConfig of allAssets) {
    await stellarService.listenToPayments(assetConfig, async (op) => {
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
