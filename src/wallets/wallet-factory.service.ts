import { Injectable } from '@nestjs/common';
import { ConfigService, InjectConfig } from 'nestjs-config';
import { BitgoDriver } from './drivers/bitgo.driver';

@Injectable()
export class WalletFactoryService {

  constructor(
    @InjectConfig()
    readonly config: ConfigService,
    readonly bitgoDriver: BitgoDriver,
  ) {
  }

  get(assetCode: string) {
    switch (assetCode) {
      case 'TBTC':
      case 'BTC':
        return this.bitgoDriver;
    }
  }
}
