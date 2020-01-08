import { InjectQueue, Process, Processor } from 'nest-bull';
import { DoneCallback, Job, Queue } from 'bull';
import { Logger } from '@nestjs/common';
import { Transaction } from './transaction.entity';
import { BigNumber } from 'bignumber.js';
import { ConfigService, InjectConfig } from 'nestjs-config';
import { TransactionLogsService } from './transaction-logs.service';
import { TransactionLog } from './transaction-log.entity';
import { StellarService } from '../wallets/stellar.service';
import { DepositMapping } from '../non-interactive/deposit-mapping.entity';

let sequence: BigNumber;

/**
 * Worker responsible for preparing transactions for signing
 * One job should not be executed multiple times as it might create multiple outgoing transactions from one incoming
 * To prevent that using redis queue which won't process job twice + db table `transaction_log` with unique constraint
 */
@Processor({ name: 'transactions' })
export class TransactionsProcessor {
  private readonly logger = new Logger(TransactionsProcessor.name);

  constructor(
    @InjectConfig()
    private readonly config: ConfigService,
    private readonly stellarService: StellarService,
    private readonly transactionLogsService: TransactionLogsService,
    @InjectQueue('sign') readonly signQueue: Queue,
  ) {}

  @Process()
  async process(job: Job<Transaction>, done: DoneCallback) {
    this.logger.log(job.data);

    const assetConfig = this.config.get('assets').getAssetConfig(job.data.asset);
    try {
      sequence = sequence
        ? sequence.add(1)
        : new BigNumber(await this.stellarService.getSequence(job.data.asset, assetConfig.channels[0]));

      // enforcing single execution through db unique constraint
      // no locking for now (simplicity)
      const txLog = await this.transactionLogsService.save({
        state: 'building',
        txIn: job.data.txIn,
        txInIndex: job.data.txInIndex,
      } as TransactionLog);
      // it throws here if such record already exists

      const result = await this.stellarService.buildPaymentTx({
        addressOut: job.data.addressOut,
        addressOutExtra: job.data.mapping.addressOutExtra,
        addressOutExtraType: (job.data.mapping as DepositMapping).addressOutExtraType,
        amount: job.data.amountOut,
        asset: job.data.asset,
        sequence,
      });
      this.logger.log(result);

      // todo: save txOut hash, channel and sequence here if empty
      // that will make sure that fields can't be overriden
      await this.transactionLogsService.save(Object.assign(txLog, {
        processedAt: new Date(),
        output: result,
      }));
      await this.signQueue.add({
        txIn: job.data.txIn,
        txInIndex: job.data.txInIndex,
        xdr: result.xdr,
        asset: job.data.asset,
      }, {
        ...this.config.get('queue').defaultJobOptions(),
      });

      done(null, result);
    } catch (err) {
      this.logger.error(err);
      done(err);
    }
  }
}
