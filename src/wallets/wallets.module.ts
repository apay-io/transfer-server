import { Module } from '@nestjs/common';
import { WalletFactoryService } from './wallet-factory.service';
import { BitgoDriver } from './drivers/bitgo.driver';
import { StellarService } from './stellar.service';

@Module({
  exports: [
    StellarService,
    WalletFactoryService,
  ],
  providers: [
    BitgoDriver,
    StellarService,
    WalletFactoryService,
  ],
})
export class WalletsModule {}
