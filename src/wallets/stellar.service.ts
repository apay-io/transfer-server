import { Injectable } from '@nestjs/common';
import { Server, TransactionBuilder, Operation, Asset, Memo, MemoType, Account, Horizon, Transaction, Keypair, StrKey } from 'stellar-sdk';
import { ConfigService, InjectConfig } from 'nestjs-config';
import { BigNumber } from 'bignumber.js';
import BalanceLineAsset = Horizon.BalanceLineAsset;
import { Wallet } from './wallet.interface';
import { TxOutput } from './dto/tx-output.dto';

@Injectable()
export class StellarService implements Wallet {
  private servers = {};

  constructor(
    @InjectConfig()
    readonly config: ConfigService,
  ) {
  }

  private getServer(asset) {
    const assetConfig = this.config.get('assets').getAssetConfig(asset);
    if (!this.servers[asset]) {
      this.servers[asset] = new Server(assetConfig.horizonUrl);
    }
    return this.servers[asset];
  }

  async checkAccount(address: string, assetCode: string, assetIssuer: string) {
    try {
      const account = await this.getServer(assetCode).loadAccount(address);
      return {
        exists: true,
        trusts: !!account.balances.find(
          (balance: BalanceLineAsset) => balance.asset_code === assetCode
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

  async buildPaymentTx(params: {
    addressOut: string,
    addressOutExtra: string,
    addressOutExtraType: MemoType,
    amount: BigNumber,
    asset: string,
    sequence: BigNumber,
  }) {
    const assetConfig = this.config.get('assets').getAssetConfig(params.asset);

    const feeStats = await this.getServer(params.asset).feeStats();
    const builder = new TransactionBuilder(
      new Account(assetConfig.channels[0], params.sequence.toString()),
      {
        fee: Math.min(parseInt(feeStats.mode_accepted_fee, 10), 10000), // moderate fee, 10000 max
        networkPassphrase: assetConfig.networkPassphrase,
      })
      .setTimeout(1200) // 20 min, enough for 10 attempts to submit
      .addOperation(Operation.payment({
        amount: params.amount.toString(10),
        asset: new Asset(assetConfig.code, assetConfig.stellar.issuer),
        destination: params.addressOut,
        source: assetConfig.distributor,
      }));

    if (params.addressOutExtra) {
      builder.addMemo(new Memo(params.addressOutExtraType, params.addressOutExtra));
    }

    const tx = builder.build();

    return {
      hash: tx.hash().toString('hex'),
      channel: assetConfig.channels[0],
      sequence: tx.sequence,
      xdr: tx.toEnvelope().toXDR('base64'),
    };
  }

  sign(xdr: string, networkPassphrase: string) {
    const tx = new Transaction(xdr, networkPassphrase);
    const keypairs = [tx.source];
    tx.operations.forEach((op) => {
      if (op.source && !keypairs.includes(op.source)) {
        keypairs.push(op.source);
      }
    });
    tx.sign(...keypairs.map((account: string) => {
      return Keypair.fromSecret(this.config.get('stellar').getSecretForAccount(account));
    }));
    return tx.toEnvelope().toXDR('base64');
  }

  submit(xdr: string, asset: string) {
    const assetConfig = this.config.get('assets').getAssetConfig(asset);

    const tx = new Transaction(xdr, assetConfig.networkPassphrase);
    return this.getServer(asset).submitTransaction(tx);
  }

  getSequence(asset: string, channel: string): Promise<string> {
    return this.getServer(asset).loadAccount(channel)
      .then((account) => account.sequenceNumber());
  }

  // actually finds circulating supply of the asset
  async getBalance(asset: string) {
    const assetConfig = this.config.get('assets').getAssetConfig(asset);

    const distributor = await this.getServer(asset).loadAccount(assetConfig.distributor);
    const distributorBalance = (distributor.balances
      .find((balance) => {
        return balance.asset_type !== 'native' && balance.asset_code === asset && balance.asset_issuer === assetConfig.stellar.issuer;
      }) || { balance: 0 }).balance;

    const excludedBalance = new BigNumber(0);
    if (assetConfig.excluded) {
      for (const excluded of assetConfig.excludedSupply) {
        try {
          const account = await this.getServer(asset).loadAccount(excluded);
          const accountBalance = (account.balances
            .find((balance) => {
              return balance.asset_type !== 'native' && balance.asset_code === asset && balance.asset_issuer === assetConfig.stellar.issuer;
            }) || { balance: 0 }).balance;
          excludedBalance.add(accountBalance);
        } catch (err) {
          // all good, don't do anything, excluded accounts don't have to exist
        }
      }
    }

    return new BigNumber(assetConfig.totalSupply).minus(excludedBalance).minus(distributorBalance);
  }

  getNewAddress(asset): Promise<string> {
    const assetConfig = this.config.get('assets').getAssetConfig(asset);
    return assetConfig.distributor;
  }

  isValidDestination(asset: string, addressOut: string, addressOutExtra: string): Promise<boolean> {
    return Promise.resolve(StrKey.isValidEd25519PublicKey(addressOut));
  };

  async checkTransaction(asset: string, txHash: string): Promise<TxOutput[]> {
    const payments = await this.getServer(asset)
      .payments()
      .forTransaction(txHash)
      .join('transactions')
      .call();
    return payments
      .records
      .filter((payment) => {
        console.log(payment);
        const assetConfig = this.config.get('assets').getAssetConfig(payment.asset_code);
        return assetConfig && payment.asset_issuer === assetConfig.stellar.issuer
          && payment.to === assetConfig.distributor;
      }).map(async (payment) => {
        const tx = await payment.transaction();
        return {
          asset: payment.asset_code,
          txIn: txHash,
          txInIndex: new BigNumber(payment.paging_token).minus(tx.paging_token).toNumber(),
          addressFrom: payment.source_account || tx.source_account,
          addressIn: payment.to,
          addressInExtra: tx.memo,
          value: payment.amount,
          confirmations: 1, // doesn't matter, it's final
        } as TxOutput;
      });
  }

  isFinalYet(value: BigNumber, confirmations: number, rateUsd: BigNumber) {
    return true;
  }
}
