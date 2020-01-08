import { InjectQueue, Process, Processor } from 'nest-bull';
import { DoneCallback, Job, Queue } from 'bull';
import { Logger } from '@nestjs/common';
import { ConfigService, InjectConfig } from 'nestjs-config';
import { TransactionState } from './enums/transaction-state.enum';
import { TransactionsService } from './transactions.service';
import { TransactionLogsService } from './transaction-logs.service';
import { TransactionLog } from './transaction-log.entity';
import { StellarService } from '../wallets/stellar.service';

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
    private readonly stellarService: StellarService,
    private readonly transactionsService: TransactionsService,
    private readonly transactionLogsService: TransactionLogsService,
  ) {}

  @Process()
  async process(job: Job<{ txIn: string, txInIndex: number, xdr: string, asset: string }>, done: DoneCallback) {
    this.logger.log(job.data);
    try {
      const txLog = await this.transactionLogsService.save({
        state: 'submitting',
        txIn: job.data.txIn,
        txInIndex: job.data.txInIndex,
      } as TransactionLog);
      // throws here if transaction log record already exists, processing won't continue
      // todo: any unsuccessful submissions can't be retried right now

      await this.transactionsService.updateState(
        job.data, TransactionState.pending_anchor, TransactionState.pending_stellar,
      );

      const result = await this.stellarService.submit(job.data.xdr, job.data.asset);
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
      await this.transactionsService.updateState(
        job.data, TransactionState.pending_stellar, TransactionState.error,
      );
      this.logger.error(err);
      done(err);
    }
  }
}
