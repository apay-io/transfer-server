import { Module } from '@nestjs/common';
import { WalletFactoryService } from './wallet-factory.service';
import { StellarService } from './stellar.service';

@Module({
  exports: [
    StellarService,
    WalletFactoryService,
  ],
  providers: [
    StellarService,
    WalletFactoryService,
  ],
})
export class WalletsModule {}
