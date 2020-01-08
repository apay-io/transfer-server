import { Injectable } from '@nestjs/common';
import { ConfigService, InjectConfig } from 'nestjs-config';
import { BaseCoin, BitGo, Wallet } from 'bitgo';
import { BigNumber } from 'bignumber.js';
import { Wallet as WalletInterface } from '../wallet.interface';
import { TxOutput } from '../dto/tx-output.dto';

@Injectable()
export class BitgoDriver implements WalletInterface {
  private bitgo = {};

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

  private getCoin(asset): BaseCoin {
    const assetConfig = this.config.get('assets').getAssetConfig(asset);
    if (!this.bitgo[asset]) {
      this.bitgo[asset] = new BitGo({
        env: assetConfig.driver.env,
        accessToken: process.env[assetConfig.driver.accessToken],
      });
    }
    return this.bitgo[asset].coin(assetConfig.driver.code);
  }

  private async getWallet(asset): Promise<Wallet> {
    const assetConfig = this.config.get('assets').getAssetConfig(asset);
    return this.getCoin(asset).wallets()
      .get({id: process.env[assetConfig.driver.walletId] });
  }

  isValidDestination(asset: string, addressOut: string, addressOutExtra: string) {
    return Promise.resolve(this.getCoin(asset).isValidAddress(addressOut));
  }

// Bitgo response looks like this
// {
//   id: 'a8b6f29e7d5cb399d39913a8d51437b355ce9852e7760bcfe57efa849003b4c4',
//   normalizedTxHash: 'b4832e4489bdff7b9d81933187486f2f81c74a8641edb82cac7528303578e16c',
//   date: '2019-12-24T00:55:01.922Z',
//   hex: '0100000001316bb64840e51af91b65eb933bfadb87427ba12deb32a5a5ad97f0028fabb0fa00000000fc0047304402207a8413cd3e8cb5a727909201f435cb8a8289cc2d11f75918d6a34b9d1953b21502200f3e32c1707c579bef3ce8457d008339ae1a3de6329772c03eacc40034d5a891014730440220079451b5e4fbec30ba1ddaf0221f99c205a27b5310a7c19eb0b773ac19d6c94d0220066b9e5a9b9c72c3040f302bdf2033405a6d849257088b27948bd54683c16829014c69522102710dc2f82d0fa8e4254d5553ed1228dede3b71f3651388a00b42122aa34ccdf021021da33356e42ab7a285bb71343d9dc19c262fe6ac28ca2b59ca3bf5f88dcfae5421033349e38ae0b6aea7b1b581546847d1ad17683b10b7aa7e5a80e2640186fedf3d53aeffffffff0240420f000000000017a914cfc29c85e91bd22b81d53d6bb3d21b2a9d1983aa8716e721010000000017a91402110e1593a8c5752cab441f0024278f4afb9c7c8700000000',
//   blockHeight: 999999999,
//   confirmations: 0,
//   fee: 938,
//   feeString: '938',
//   size: 367,
//   inputIds: [
//     'fab0ab8f02f097ada5a532eb2da17b4287dbfa3b93eb651bf91ae54048b66b31:0'
//   ],
//   inputs: [
//     {
//       id: 'fab0ab8f02f097ada5a532eb2da17b4287dbfa3b93eb651bf91ae54048b66b31:0',
//       address: '2Mwch1TEGJXbvG7sbwMwLZofD5K1aBJegqL',
//       value: 20000000,
//       valueString: '20000000',
//       isSegwit: false
//     }
//   ],
//   outputs: [
//     {
//       id: 'a8b6f29e7d5cb399d39913a8d51437b355ce9852e7760bcfe57efa849003b4c4:0',
//       address: '2NCBkzqAZzJtwYwR4XpDPFSfigvMfNnPvD3',
//       value: 1000000,
//       valueString: '1000000',
//       wallet: '5de478876984c5f305ad8b1f97a905e4',
//       chain: 10,
//       index: 1,
//       redeemScript: '0020f0bd3b6b97f38d8539a8b27bb715daaa2c55df003b4d4045785dc6a77c5e27b2',
//       isSegwit: true
//     },
//     {
//       id: 'a8b6f29e7d5cb399d39913a8d51437b355ce9852e7760bcfe57efa849003b4c4:1',
//       address: '2MsS9mfsL9JEA85kBu6sLDyJtGV6QNn9UeN',
//       value: 18999062,
//       valueString: '18999062',
//       redeemScript: '0020db2ae03e822a7a1909710105b130f11db36b53102b143ad51ce72f456d99899e',
//       isSegwit: true
//     }
//   ],
//   entries: [
//     {
//       address: '2Mwch1TEGJXbvG7sbwMwLZofD5K1aBJegqL',
//       coinName: 'tbtc',
//       inputs: 1,
//       outputs: 0,
//       value: -20000000,
//       valueString: '-20000000'
//     },
//     {
//       address: '2NCBkzqAZzJtwYwR4XpDPFSfigvMfNnPvD3',
//       wallet: '5de478876984c5f305ad8b1f97a905e4',
//       coinName: 'tbtc',
//       inputs: 0,
//       outputs: 1,
//       value: 1000000,
//       valueString: '1000000'
//     },
//     {
//       address: '2MsS9mfsL9JEA85kBu6sLDyJtGV6QNn9UeN',
//       coinName: 'tbtc',
//       inputs: 0,
//       outputs: 1,
//       value: 18999062,
//       valueString: '18999062'
//     }
//   ]
// }
  async checkTransaction(asset: string, txHash: string): Promise<TxOutput[]> {
    const wallet = await this.getWallet(asset.toUpperCase());
    const tx = await wallet.getTransaction({ txHash });
    return tx.outputs.filter((item) => !!item.wallet).map((output) => {
      const [hash, index] = output.id.split(':');
      return {
        asset: asset.toUpperCase(),
        txIn: hash,
        txInIndex: index,
        addressFrom: tx.inputs[0].address,
        addressIn: output.address,
        value: new BigNumber(output.valueString).dividedBy(1e8),
        confirmations: tx.confirmations,
      };
    });
  }

  async getBalance(asset: string) {
    const wallet = await this.getWallet(asset);
    return new BigNumber(wallet.balanceString()).dividedBy(1e8);
  }

  /**
   * Making decision whether we can accept transaction as final based on value and number of confirmations
   * @param value
   * @param confirmations
   * @param rateUsd
   */
  isFinalYet(value: BigNumber, confirmations: number, rateUsd: BigNumber) {
    if (rateUsd.greaterThan(0)) {
      const usdAmount = value.div(rateUsd).toNumber();
      return confirmations >= Math.max(Math.log10(usdAmount) - 1, 1);
    }
    return false;
  }
}
