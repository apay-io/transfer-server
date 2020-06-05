import { Test, TestingModule } from '@nestjs/testing';
import { StellarService } from './stellar.service';
import { RedisService } from 'nestjs-redis';
import { WalletFactoryService } from './wallet-factory.service';
import { TransactionType } from '../transactions/enums/transaction-type.enum';
import { ConfigModule } from '@nestjs/config';

describe('WalletFactoryService', () => {
  let walletFactory: WalletFactoryService;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          envFilePath: [process.cwd() + '/' + (process.env.NODE_ENV || '') + '.env'],
        }),
      ],
      providers: [
        { provide: RedisService, useValue: {}},
        StellarService,
        WalletFactoryService,
      ],
    }).compile();

    walletFactory = app.get(WalletFactoryService);
  });

  describe('wallet factory service', () => {
    it('get wallets', async () => {
      expect((await walletFactory.get(TransactionType.deposit, 'TBTC')).walletOut)
        .toBeTruthy();
      expect((await walletFactory.get(TransactionType.withdrawal, 'TBTC')).walletIn)
        .toBeTruthy();
    });
  });
});
