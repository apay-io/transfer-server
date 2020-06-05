import { Module } from '@nestjs/common';
import { WalletFactoryService } from './wallet-factory.service';
import { StellarService } from './stellar.service';
import { ConfigModule } from '@nestjs/config';
import stellar from '../config/stellar';

@Module({
  exports: [
    StellarService,
    WalletFactoryService,
  ],
  imports: [
    ConfigModule.forFeature(stellar)
  ],
  providers: [
    StellarService,
    WalletFactoryService,
  ],
})
export class WalletsModule {}
