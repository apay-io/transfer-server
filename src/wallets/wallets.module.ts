import { Module } from '@nestjs/common';
import { WalletFactoryService } from './wallet-factory.service';
import { BitgoDriver } from './drivers/bitgo.driver';

@Module({
  exports: [
    WalletFactoryService,
  ],
  providers: [
    BitgoDriver,
    WalletFactoryService,
  ],
})
export class WalletsModule {}
