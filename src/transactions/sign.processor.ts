import { InjectQueue, Process, Processor } from '@nestjs/bull';
import { DoneCallback, Job, Queue } from 'bull';
import { Logger } from '@nestjs/common';
import { WalletFactoryService } from '../wallets/wallet-factory.service';
import { ConfigService, InjectConfig } from 'nestjs-config';
import { TransactionLog } from './transaction-log.entity';
import { TransactionLogsService } from './transaction-logs.service';
import { StellarService } from '../wallets/stellar.service';
import { TransactionType } from './enums/transaction-type.enum';
import { BigNumber } from 'bignumber.js';

/**
 * Worker responsible for signing prepared stellar transactions
 * Can be run in separate isolated environment for additional security, it's the only place in code, that requires access to secret keys
 * Doesn't matter if executed multiple times, sequence has already been defined
 * Performs extra sanity checks/asserts before signing transactions
 *  - real asset balance should always be greater or equal to assets in circulation on stellar
 *  (it won't catch anything if few transactions going out at the same time)
 */
@Processor('sign')
export class SignProcessor {
  private readonly logger = new Logger(SignProcessor.name);

  constructor(
    @InjectConfig()
    private readonly config: ConfigService,
    private readonly stellarService: StellarService,
    private readonly transactionLogsService: TransactionLogsService,
    private readonly walletFactoryService: WalletFactoryService,
    @InjectQueue('submit') readonly submitQueue: Queue,
  ) {}

  @Process()
  async process(job: Job<{
                  channel: string,
                  sequence: string,
                  xdr: string,
                  asset: string,
                  type: TransactionType,
                  totalChange: string,
                }>,
                done: DoneCallback) {
    this.logger.log(job.data);
    const txLog = await this.transactionLogsService.save({
      state: 'signing',
      channel: job.data.channel,
      sequence: job.data.sequence,
    } as TransactionLog);
    try {

      // todo: more pre-signing checks
      // just one more sanity check: making sure that real balance exceeds issued assets
      const totalChange = new BigNumber(job.data.totalChange);
      const { walletIn, walletOut } = this.walletFactoryService.get(job.data.type, job.data.asset);
      const balanceIn = await walletIn.getBalance(job.data.asset);
      const balanceOut = await walletOut.getBalance(job.data.asset);
      this.logger.log({ balanceIn: balanceIn.toString(10), balanceOut: balanceOut.toString(10), totalChange });
      if (job.data.type === TransactionType.deposit && balanceIn.lessThan(balanceOut.add(totalChange))) {
        throw new Error('balance mismatch, something\'s wrong');
      }
      if (job.data.type === TransactionType.withdrawal && balanceIn.greaterThan(balanceOut.minus(totalChange))) {
        throw new Error('balance mismatch, something\'s wrong');
      }

      const signedTx = await walletOut.sign(job.data.xdr, job.data.asset);

      await this.transactionLogsService.save(Object.assign(txLog, {
        processedAt: new Date(),
        output: { rawTx: signedTx },
      }));
      await this.submitQueue.add({
        channel: job.data.channel,
        sequence: job.data.sequence,
        rawTx: signedTx,
        asset: job.data.asset,
        type: job.data.type,
      }, {
        ...this.config.get('queue').defaultJobOptions(),
        timeout: 120000, // 2 min
      });
      done(null, signedTx);
    } catch (err) {
      await this.transactionLogsService.save(Object.assign(txLog, {
        processedAt: new Date(),
        output: { err },
      }));
      this.logger.error(err);
      done(err);
    }
  }
}
