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

  async getNewAddress(asset): Promise<string> {
    const wallet = await this.getWallet(asset);
    const bitGoAddress = await wallet.createAddress({ chain: 20 });
    return bitGoAddress.address;
  }

  private getCoin(asset) {
    if (!this.bitgo) {
      this.bitgo = new BitGo({
        env: this.config.get('bitgo').env,
        accessToken: this.config.get('bitgo').accessToken,
      });
    }
    return this.bitgo.coin(asset.toLowerCase());
  }

  private async getWallet(asset): Promise<Wallet> {
    return this.getCoin(asset).wallets()
      .get({id: this.config.get('bitgo').walletIds[asset.toLowerCase()]});
  }

  isValidDestination(asset: string, addressOut: string, addressOutExtra: string) {
    return this.getCoin(asset).isValidAddress(addressOut);
  }
}
