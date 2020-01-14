import { NestFactory } from '@nestjs/core';
import { TransactionsService } from './transactions/transactions.service';
import { AppModule } from './app.module';
import { ConfigService } from 'nestjs-config';

/**
 * Separate process, that takes all pending withdrawals from DB and puts them into processing queue
 */
async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const configService = app.get<ConfigService>(ConfigService);
  const txService = app.get<TransactionsService>(TransactionsService);

  const batchingAssets = configService.get('assets').raw.filter((item) => item.withdrawalBatching);

  for (const assetConfig of batchingAssets) {
    setInterval(async () => {
      await txService.enqueuePendingWithdrawals(assetConfig.code);
    }, assetConfig.withdrawalBatching);
  }
}

bootstrap();
