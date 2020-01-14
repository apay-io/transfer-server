import { InjectQueue, Process, Processor } from 'nest-bull';
import { DoneCallback, Job, Queue } from 'bull';
import { Logger } from '@nestjs/common';
import { ConfigService, InjectConfig } from 'nestjs-config';
import { TransactionState } from './enums/transaction-state.enum';
import { TransactionsService } from './transactions.service';
import { TransactionLogsService } from './transaction-logs.service';
import { TransactionLog } from './transaction-log.entity';
import { WalletFactoryService } from '../wallets/wallet-factory.service';
import { TransactionType } from './enums/transaction-type.enum';

/**
 * Worker responsible for submitting signed transactions to the network
 * Multiple processing of the same job is not a problem, first submission will return success, following submissions are going to fail
 * Saving transaction log just to track processing time
 */
@Processor({ name: 'submit' })
export class SubmitProcessor {
  private readonly logger = new Logger(SubmitProcessor.name);

  constructor(
    @InjectConfig()
    private readonly config: ConfigService,
    private readonly walletFactoryService: WalletFactoryService,
    private readonly transactionsService: TransactionsService,
    private readonly transactionLogsService: TransactionLogsService,
  ) {}

  @Process()
  async process(job: Job<{ channel: string, sequence: string, rawTx: string, asset: string, type: TransactionType }>, done: DoneCallback) {
    this.logger.log(job.data);
    const txLog = await this.transactionLogsService.save({
      state: 'submitting',
      channel: job.data.channel,
      sequence: job.data.sequence,
    } as TransactionLog);
    try {
      const { walletOut } = this.walletFactoryService.get(job.data.type, job.data.asset);

      await this.transactionsService.updateState(
        job.data, TransactionState.pending_anchor, TransactionState.pending_stellar,
      );

      const result = await walletOut.submit(job.data.rawTx, job.data.asset);
      this.logger.log(result);

      await this.transactionLogsService.save(Object.assign(txLog, {
        processedAt: new Date(),
        output: result,
      }));
      await this.transactionsService.updateState(
        job.data, TransactionState.pending_stellar, TransactionState.completed,
      );
      done(null, result);
    } catch (err) {
      // todo: check what kind of error, if timeout - need to determine tx status, not just retry
      await this.transactionLogsService.save(Object.assign(txLog, {
        processedAt: new Date(),
        output: { err },
      }));
      await this.transactionsService.updateState(
        job.data, TransactionState.pending_stellar, TransactionState.error,
      );
      this.logger.error(err);
      done(err);
    }
  }
}
