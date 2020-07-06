import { Injectable } from '@nestjs/common';
import {
  Server,
  TransactionBuilder,
  Operation,
  Asset,
  Memo,
  MemoType,
  Account,
  Horizon,
  Transaction,
  Keypair,
  StrKey,
  MemoID
} from 'stellar-sdk';
import { BigNumber } from 'bignumber.js';
import BalanceLineAsset = Horizon.BalanceLineAsset;
import { Wallet } from './wallet.interface';
import { TxOutput } from './dto/tx-output.dto';
import { AssetInterface } from '../interfaces/asset.interface';
import { RedisService } from 'nestjs-redis';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class StellarService implements Wallet {
  private servers = {};
  private sequences = {};

  constructor(
    readonly config: ConfigService,
    private readonly redisService: RedisService,
  ) {
  }

  getServerByAsset(asset: string) {
    const assetConfig = this.config.get('assets').getAssetConfig(asset);
    return this.getServer(assetConfig.networkPassphrase);
  }

  getServer(networkPassphrase: string) {
    if (!this.servers[networkPassphrase]) {
      this.servers[networkPassphrase] = new Server(this.config.get('stellar').horizonUrls[networkPassphrase]);
    }
    return this.servers[networkPassphrase];
  }

  async checkAccount(address: string, assetCode: string, assetIssuer: string) {
    try {
      const account = await this.getServerByAsset(assetCode).loadAccount(address);
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

  // not batching stellar txs, assuming there is only 1 element in recipients array
  async buildPaymentTx(params: {
    recipients: {
      addressOut: string,
      addressOutExtra: string,
      addressOutExtraType: MemoType,
      amount: BigNumber,
      asset: string,
    }[],
    channel: string,
    sequence: BigNumber,
  }) {
    const asset = params.recipients[0].asset;
    const assetConfig = this.config.get('assets').getAssetConfig(asset);

    const builder = new TransactionBuilder(
      new Account(params.channel, params.sequence.toString()),
      {
        fee: await this.getModerateFee(assetConfig.networkPassphrase),
        networkPassphrase: assetConfig.networkPassphrase,
      })
      .setTimeout(1200) // 20 min, enough for 10 attempts to submit
      .addOperation(Operation.payment({
        amount: params.recipients[0].amount.toString(10),
        asset: new Asset(assetConfig.code, assetConfig.stellar.issuer),
        destination: params.recipients[0].addressOut,
        source: assetConfig.distributor,
      }));

    if (params.recipients[0].addressOutExtra) {
      builder.addMemo(new Memo(params.recipients[0].addressOutExtraType, params.recipients[0].addressOutExtra));
    }

    const tx = builder.build();

    return {
      hash: tx.hash().toString('hex'),
      rawTx: tx.toEnvelope().toXDR('base64').toString(),
    };
  }

  async getModerateFee(networkPassphrase: string) {
    if (this.config.get('stellar').skipFeeEstimation) {
      return '100';
    }
    const feeStats = await this.getServer(networkPassphrase).feeStats();
    return Math.min(parseInt(feeStats.fee_charged.mode, 10), 10000).toString(); // moderate fee, 10000 max
  }

  sign(rawTx: string, asset: string) {
    const assetConfig = this.config.get('assets').getAssetConfig(asset);
    const tx = new Transaction(rawTx, assetConfig.networkPassphrase);
    const keypairs = [tx.source];
    tx.operations.forEach((op) => {
      if (op.source && !keypairs.includes(op.source)) {
        keypairs.push(op.source);
      }
    });
    tx.sign(...keypairs.map((account: string) => {
      return Keypair.fromSecret(this.config.get('stellar').getSecretForAccount(account));
    }));
    return Promise.resolve(tx.toEnvelope().toXDR('base64').toString());
  }

  submit(rawTx: string, asset: string) {
    const assetConfig = this.config.get('assets').getAssetConfig(asset);

    const tx = new Transaction(rawTx, assetConfig.networkPassphrase);
    return this.getServerByAsset(asset).submitTransaction(tx);
  }

  getSequence(asset: string, channel: string): Promise<string> {
    return this.getServerByAsset(asset).loadAccount(channel)
      .then((account) => account.sequenceNumber());
  }

  // actually finds circulating supply of the asset
  async getBalance(asset: string) {
    const assetConfig = this.config.get('assets').getAssetConfig(asset);

    const distributor = await this.getServerByAsset(asset).loadAccount(assetConfig.distributor);
    const distributorBalance = (distributor.balances
      .find((balance) => {
        return balance.asset_type !== 'native' && balance.asset_code === asset && balance.asset_issuer === assetConfig.stellar.issuer;
      }) || { balance: 0 }).balance;

    const excludedBalance = new BigNumber(0);
    if (assetConfig.excluded) {
      for (const excluded of assetConfig.excludedSupply) {
        try {
          const account = await this.getServerByAsset(asset).loadAccount(excluded);
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
  }

  async checkTransaction(asset: string, txHash: string): Promise<TxOutput[]> {
    const payments = await this.getServerByAsset(asset)
      .payments()
      .forTransaction(txHash)
      .join('transactions')
      .call();
    const filteredPayments = payments
      .records
      .filter((payment) => {
        const assetConfig = this.config.get('assets').getAssetConfig(payment.asset_code);
        return assetConfig && payment.asset_issuer === assetConfig.stellar.issuer
          && payment.to === assetConfig.distributor;
      });

    const results = [];
    for (const payment of filteredPayments) {
      const tx = await payment.transaction();
      if (tx.memo_type !== MemoID || !tx.memo) {
        // todo: send tx without memo for refund
        continue;
      }
      results.push({
        asset: payment.asset_code,
        txIn: txHash,
        txInIndex: new BigNumber(payment.paging_token).minus(tx.paging_token).toNumber(),
        addressFrom: payment.source_account || tx.source_account,
        addressIn: payment.to,
        addressInExtra: tx.memo,
        value: new BigNumber(payment.amount),
        confirmations: 1, // doesn't matter, it's final
      } as TxOutput);
    }
    return results;
  }

  isFinalYet(value: BigNumber, confirmations: number, rateUsd: BigNumber) {
    return true;
  }

  async getChannelAndSequence(asset: string, channelInput: string, sequenceInput: string) {
    const assetConfig = this.config.get('assets').getAssetConfig(asset);
    this.sequences[asset] = this.sequences[asset]
      ? this.sequences[asset].add(1)
      : new BigNumber(await this.getSequence(asset, assetConfig.channels[0]));
    return {
      channel: assetConfig.channels[0],
      sequence: this.sequences[asset].toString(10),
    };
  }

  async listenToPayments(assetConfig: AssetInterface, callback: (op) => Promise<any>) {
    const builder = this.getServerByAsset(assetConfig.code)
      .payments()
      .forAccount(assetConfig.distributor);

    const client = this.redisService.getClient();
    const cursor = await client.get(`${process.env.NODE_ENV}:stellar-listener:${assetConfig.code}`);
    if (cursor) {
      builder.cursor(cursor);
    }

    builder.stream({
      onmessage: async (op) => {
        if (op.transaction_successful
          && op.asset_type
          && op.asset_type !== 'native'
          && op.asset_issuer === assetConfig.stellar.issuer
          && op.to === assetConfig.distributor
        ) {
          await callback(op);
          await client.set(`${process.env.NODE_ENV}:stellar-listener:${assetConfig.code}`, op.paging_token);
        }
      },
    });
  }

}
