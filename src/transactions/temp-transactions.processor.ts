import { InjectQueue, Process, Processor } from 'nest-bull';
import { DoneCallback, Job, Queue } from 'bull';
import { Logger } from '@nestjs/common';
import { WalletFactoryService } from '../wallets/wallet-factory.service';
import { TransactionsService } from './transactions.service';
import { TransactionType } from './enums/transaction-type.enum';
import { Transaction } from './transaction.entity';
import { TransactionState } from './enums/transaction-state.enum';
import { DepositMappingService } from '../non-interactive/deposit-mapping.service';
import { BigNumber } from 'bignumber.js';
import { ConfigService, InjectConfig } from 'nestjs-config';
import { StellarService } from '../non-interactive/stellar.service';
import { UtilsService } from '../utils/utils.service';

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
    private readonly depositMappingService: DepositMappingService,
    private readonly walletFactoryService: WalletFactoryService,
    private readonly stellarService: StellarService,
    private readonly transactionsService: TransactionsService,
    @InjectQueue('transactions') readonly queue: Queue,
  ) {}

  @Process()
  async process(job: Job<{ hash: string, chain: string }>, done: DoneCallback) {
    this.logger.log(job.data);
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
          const depositMapping = await this.depositMappingService.find(output.asset, output.to);
          // checking for account existence here to make amount_out/amount_fee immutable
          // if account deleted after this check - resolution manual through support for now
          const { exists, trusts } = await this.checkAccount(depositMapping.addressOut, output.asset);
          this.logger.log({ account: depositMapping.addressOut, exists, trusts });
          const amount = (new BigNumber(output.value)).div(1e8);
          const fee = this.calculateFee(amount, output.asset, !exists);
          const rateUsd = new BigNumber(rates[output.asset] || 0);
          const isFinal = this.isFinalYet(output, rateUsd);
          allFinal = allFinal && isFinal;

          // todo: check existing incomplete transaction and update its state

          // deduplication by txIn & txInIndex, keep in mind tx malleability when listing coins
          const tx = {
            type: TransactionType.deposit,
            state: trusts
              ? (isFinal ? TransactionState.pending_anchor : TransactionState.pending_external)
              : TransactionState.pending_trust,
            txIn: output.hash,
            txInIndex: output.index,
            addressFrom: output.from,
            addressIn: output.to,
            addressOut: depositMapping.addressOut,
            addressOutExtra: depositMapping.addressOutExtra,
            asset: output.asset,
            amountIn: amount,
            amountFee: fee,
            amountOut: amount.minus(fee),
            rateUsd,
            refunded: false,
            mapping: depositMapping,
          } as Transaction;

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

  private calculateFee(amount: BigNumber, asset: string, needsFunding: boolean) {
    const assetConfig = this.config.get('assets').getAssetConfig(asset);
    return amount
      .mul(assetConfig.deposit.fee_percent)
      .add(assetConfig.deposit.fee_fixed)
      .add(needsFunding ? assetConfig.deposit.fee_create : 0);
  }

  private isFinalYet(output, rateUsd: BigNumber) {
    if (rateUsd.greaterThan(0)) {
      const usdAmount = (new BigNumber(output.value)).div(1e8).div(rateUsd).toNumber();
      return output.confirmations >= Math.max(Math.log10(usdAmount) - 1, 1);
    }
    return false;
  }
}
