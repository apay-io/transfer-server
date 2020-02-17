import { Module } from '@nestjs/common';
import { WalletFactoryService } from './wallet-factory.service';
import { BitgoDriver } from './drivers/bitgo.driver';
import { StellarService } from './stellar.service';
import { RedisService } from 'nestjs-redis';

@Module({
  exports: [
    StellarService,
    WalletFactoryService,
  ],
  imports: [
    RedisService,
  ],
  providers: [
    BitgoDriver,
    StellarService,
    WalletFactoryService,
  ],
})
export class WalletsModule {}
