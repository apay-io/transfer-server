import { Injectable } from '@nestjs/common';
import { ConfigService, InjectConfig } from 'nestjs-config';
import { BitGo, Wallet } from 'bitgo';

@Injectable()
export class BitgoDriver {
  private bitgo: BitGo;

  constructor(
    @InjectConfig()
    readonly config: ConfigService,
  ) {
  }

  async getNewAddress(asset): Promise<{ addressIn: string, addressInExtra: string}> {
    const wallet = await this.getWallet(asset);
    const bitGoAddress = await wallet.createAddress({ chain: 20 });
    return {
      addressIn: bitGoAddress.address,
      addressInExtra: null,
    };
  }

  private async getWallet(asset): Promise<Wallet> {
    if (!this.bitgo) {
      this.bitgo = new BitGo({
        env: this.config.get('bitgo').env,
        accessToken: this.config.get('bitgo').accessToken,
      });
    }
    const coin = asset.toLowerCase();
    return this.bitgo.coin(coin).wallets()
      .get({id: this.config.get('bitgo').walletIds[coin]});
  }
}
