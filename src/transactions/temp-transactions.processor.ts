import { InjectQueue, Process, Processor } from 'nest-bull';
import { DoneCallback, Job, Queue } from 'bull';
import { Logger } from '@nestjs/common';
import { WalletFactoryService } from '../wallets/wallet-factory.service';
import { TransactionsService } from './transactions.service';
import { TransactionType } from './enums/transaction-type.enum';
import { TransactionState } from './enums/transaction-state.enum';
import { BigNumber } from 'bignumber.js';
import { ConfigService, InjectConfig } from 'nestjs-config';
import { UtilsService } from '../utils/utils.service';
import { StellarService } from '../wallets/stellar.service';
import { AddressMappingService } from '../non-interactive/address-mapping.service';
import { Transaction } from './transaction.entity';
import { TempTransactionsService } from './temp-transactions.service';

/**
 * Processing initiated by a new confirmation webhook or the trustline from the user
 * Once trustline exists and transaction is final - put into the main processing queue
 */
@Processor({ name: 'temp-transactions' })
export class TempTransactionsProcessor {
  private readonly logger = new Logger(TempTransactionsProcessor.name);

  constructor(
    @InjectConfig()
    private readonly config: ConfigService,
    private readonly utilsService: UtilsService,
    private readonly mappingService: AddressMappingService,
    private readonly walletFactoryService: WalletFactoryService,
    private readonly stellarService: StellarService,
    private readonly tempTransactionsService: TempTransactionsService,
    private readonly transactionsService: TransactionsService,
    @InjectQueue('transactions') readonly queue: Queue,
  ) {}

  @Process()
  async process(job: Job<{ type: TransactionType, asset: string, hash: string }>, done: DoneCallback) {
    this.logger.log(job.data);
    const { walletIn, walletOut } = this.walletFactoryService.get(job.data.type, job.data.asset);
    try {
      // go through outputs and check if any goes to our address
      // create permanent tx in db with amounts
      const outputs = await walletIn.checkTransaction(job.data.asset, job.data.hash);
      this.logger.debug(outputs);
      const rates = await this.utilsService.getRates();
      let allFinal = true;

      if (outputs.length) {
        for (const output of outputs) {
          const mapping = await this.mappingService.find(output.asset, output.addressIn, output.addressInExtra);
          this.logger.debug(mapping);

          // checking for account existence here to make amount_out/amount_fee immutable, it only makes sense for deposits
          // if account deleted after this check - resolution manual through support for now
          const { exists, trusts } = job.data.type === TransactionType.withdrawal
            ? { exists: true, trusts: true }
            : await this.checkAccount(mapping.addressOut, output.asset);
          this.logger.debug({ exists, trusts });

          const fee = this.calculateFee(job.data.type, output.value, output.asset, !exists);
          this.logger.debug(fee);
          const rateUsd = new BigNumber(rates[output.asset] || 0);
          this.logger.debug(rateUsd);
          const isFinal = walletIn.isFinalYet(output.value, output.confirmations, rateUsd);
          this.logger.debug(isFinal);
          allFinal = allFinal && isFinal;

          let tx;
          const existingTx = await this.transactionsService.findOne({
            txIn: output.txIn,
            txInIndex: output.txInIndex,
          });
          if (!existingTx) {
            const {channel, sequence} = await walletOut.getChannelAndSequence(
              job.data.asset, `${output.txIn}:${output.txInIndex}`, (new Date()).getTime().toString(10),
            );
            this.logger.debug({channel, sequence});

            // deduplication by txIn & txInIndex, keep in mind tx malleability when listing coins
            tx = {
              type: job.data.type,
              txIn: output.txIn,
              txInIndex: output.txInIndex,
              addressFrom: output.addressFrom,
              addressIn: output.addressIn,
              addressInExtra: (output.addressInExtra ? output.addressInExtra.toString(10) : null),
              addressOut: mapping.addressOut,
              addressOutExtra: mapping.addressOutExtra,
              asset: output.asset,
              amountIn: output.value,
              amountFee: fee,
              amountOut: output.value.minus(fee),
              rateUsd,
              channel,
              sequence,
              refunded: false,
              mapping,
            } as Transaction;

          } else {
            tx = existingTx;
          }
          tx.state = trusts
            ? (isFinal ? TransactionState.pending_anchor : TransactionState.pending_external)
            : TransactionState.pending_trust;
          this.logger.log(tx);
          await this.transactionsService.save(tx);
          await this.tempTransactionsService.delete(job.data.asset, job.data.hash);

          if (trusts && isFinal && !this.batching(tx.type, tx.asset)) {
            await this.queue.add({ txs: [tx] }, {
              ...this.config.get('queue').defaultJobOptions(),
            });
            this.logger.log('tx enqueued');
          }
        }
      }
      if (allFinal) {
        this.logger.log('job done ' + job.id);
        done(null, job.data);
      } else {
        this.logger.log('not final ' + job.id);
        done(new Error('not final'));
      }
    } catch (err) {
      if (err.status !== 404) {
        this.logger.error(err);
      } else {
        this.logger.log('not found ' + job.id);
      }
      done(err);
    }
  }

  private async checkAccount(address: string, asset: string) {
    const assetConfig = this.config.get('assets').getAssetConfig(asset);
    return this.stellarService.checkAccount(address, asset, assetConfig.stellar.issuer);
  }

  private calculateFee(type: TransactionType, amount: BigNumber, asset: string, needsFunding: boolean) {
    const assetConfig = this.config.get('assets').getAssetConfig(asset);
    if (type === TransactionType.deposit) {
      return amount
        .mul(assetConfig.deposit.fee_percent)
        .add(assetConfig.deposit.fee_fixed)
        .add(needsFunding ? assetConfig.deposit.fee_create : 0);
    } else {
      return amount
        .mul(assetConfig.withdrawal.fee_percent)
        .add(assetConfig.withdrawal.fee_fixed);
    }
  }

  private batching(type: string, asset: string) {
    const assetConfig = this.config.get('assets').getAssetConfig(asset);
    return type === TransactionType.withdrawal && assetConfig.withdrawalBatching;
  }
}
