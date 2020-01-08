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
    private readonly transactionsService: TransactionsService,
    @InjectQueue('transactions') readonly queue: Queue,
  ) {}

  @Process()
  async process(job: Job<{ hash: string, chain: string }>, done: DoneCallback) {
    this.logger.log(job.data);
    const type = ['xlm', 'txlm'].includes(job.data.chain) ? TransactionType.withdrawal : TransactionType.deposit;
    const wallet = this.walletFactoryService.get(job.data.chain);
    try {
      // go through outputs and check if any goes to our address
      // create permanent tx in db with amounts
      const outputs = await wallet.checkTransaction(job.data.chain, job.data.hash);
      this.logger.log(outputs);
      const rates = await this.utilsService.getRates();
      let allFinal = true;

      if (outputs.length) {
        for (const output of outputs) {
          const mapping = await this.mappingService.find(output.asset, output.addressIn, output.addressInExtra);
          this.logger.log(mapping);

          // checking for account existence here to make amount_out/amount_fee immutable, it only makes sense for deposits
          // if account deleted after this check - resolution manual through support for now
          const { exists, trusts } = type === TransactionType.withdrawal
            ? { exists: true, trusts: true }
            : await this.checkAccount(mapping.addressOut, output.asset);
          this.logger.log({ account: mapping.addressOut, exists, trusts });

          const fee = this.calculateFee(type, output.value, output.asset, !exists);
          const rateUsd = new BigNumber(rates[output.asset] || 0);
          const isFinal = wallet.isFinalYet(output.value, output.confirmations, rateUsd);
          allFinal = allFinal && isFinal;

          // todo: check existing incomplete transaction and update its state

          // deduplication by txIn & txInIndex, keep in mind tx malleability when listing coins
          const tx = {
            type,
            state: trusts
              ? (isFinal ? TransactionState.pending_anchor : TransactionState.pending_external)
              : TransactionState.pending_trust,
            txIn: output.txIn,
            txInIndex: output.txInIndex,
            addressFrom: output.addressFrom,
            addressIn: output.addressIn,
            addressOut: mapping.addressOut,
            addressOutExtra: mapping.addressOutExtra,
            asset: output.asset,
            amountIn: output.value,
            amountFee: fee,
            amountOut: output.value.minus(fee),
            rateUsd,
            refunded: false,
            mapping,
          };

          await this.transactionsService.save(tx);

          if (trusts && isFinal) {
            // add to the processing signQueue
            await this.queue.add(tx, {
              attempts: 5,
              backoff: {
                type: 'exponential',
              },
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
}
