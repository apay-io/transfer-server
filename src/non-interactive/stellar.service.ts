import { Injectable } from '@nestjs/common';
import { Server } from 'stellar-sdk';
import { ConfigService, InjectConfig } from 'nestjs-config';

@Injectable()
export class StellarService {
  private server;

  constructor(
    @InjectConfig()
    readonly config: ConfigService,
  ) {
  }

  private getServer() {
    if (!this.server) {
      this.server = new Server(this.config.get('stellar').horizonUrl);
    }
    return this.server;
  }

  async checkAccount(address: string, assetCode: string, assetIssuer: string) {
    try {
      const account = await this.getServer().loadAccount(address);
      return {
        exists: true,
        trusts: !!account.balances.find(
          (balance) => balance.asset_code === assetCode
            && balance.asset_issuer === assetIssuer,
        ),
      };
    } catch (err) {
      if (err.response.status !== 404) {
        throw err;
      }
    }
    return {
      exists: false,
      trusts: false,
    };
  }
}
