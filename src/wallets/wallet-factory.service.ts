import { Injectable } from '@nestjs/common';
import { ConfigService, InjectConfig } from 'nestjs-config';
import { BitgoDriver } from './drivers/bitgo.driver';
import { StellarService } from './stellar.service';
import { Wallet } from './wallet.interface';

@Injectable()
export class WalletFactoryService {

  constructor(
    @InjectConfig()
    readonly config: ConfigService,
    readonly bitgoDriver: BitgoDriver,
    readonly stellarDriver: StellarService,
  ) {
  }

  get(assetCode: string): Wallet {
    switch (assetCode.toUpperCase()) {
      case 'TBTC':
      case 'BTC':
        return this.bitgoDriver;
      case 'TXLM':
      case 'XLM':
        return this.stellarDriver;
    }
  }
}
