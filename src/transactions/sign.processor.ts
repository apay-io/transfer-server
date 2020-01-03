import { InjectQueue, Process, Processor } from 'nest-bull';
import { DoneCallback, Job, Queue } from 'bull';
import { Logger } from '@nestjs/common';
import { WalletFactoryService } from '../wallets/wallet-factory.service';
import { ConfigService, InjectConfig } from 'nestjs-config';
import { StellarService } from '../non-interactive/stellar.service';
import { TransactionLog } from './transaction-log.entity';
import { TransactionLogsService } from './transaction-logs.service';

/**
 * Worker responsible for signing prepared stellar transactions
 * Can be run in separate isolated environment for additional security, it's the only place in code, that requires access to secret keys
 * Uses `bull` queue manager + db table `transaction_log` with unique constraint to ensure single processing of tx
 * Processing of the same job multiple times shouldn't be a problem, since sequence number has already been set.
 * Performs extra sanity checks/asserts before signing transactions
 *  - real asset balance should always be greater or equal to assets in circulation on stellar
 *  (it won't catch anything if few transactions going out at the same time)
 */
@Processor({ name: 'sign' })
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
  async process(job: Job<{ txIn: string, txInIndex: number, xdr: string, asset: string }>, done: DoneCallback) {
    this.logger.log(job.data);
    const assetConfig = this.config.get('assets').getAssetConfig(job.data.asset);
    try {
      const txLog = await this.transactionLogsService.save({
        state: 'signing',
        txIn: job.data.txIn,
        txInIndex: job.data.txInIndex,
      } as TransactionLog);

      // todo: more pre-signing checks
      // just once more making sure that real balance exceeds issued assets
      const wallet = this.walletFactoryService.get(job.data.asset);
      const balance = await wallet.getBalance(job.data.asset);
      const circulatingSupply = await this.stellarService.getCirculatingSupply(job.data.asset);
      this.logger.log({ balance: balance.toString(10), supply: circulatingSupply.toString(10)});
      if (balance.lessThan(circulatingSupply)) {
        throw new Error('balance mismatch, something\'s wrong');
      }

      const signedXdr = this.stellarService.sign(job.data.xdr, assetConfig.stellar.networkPassphrase);

      await this.transactionLogsService.save(Object.assign(txLog, {
        processedAt: new Date(),
        output: { xdr: signedXdr },
      }));
      await this.submitQueue.add({
        txIn: job.data.txIn,
        txInIndex: job.data.txInIndex,
        xdr: signedXdr,
        asset: job.data.asset,
      }, {
        attempts: 10,
        backoff: 120000,
        ...this.config.get('queue').defaultJobOptions(),
        timeout: 120000, // 2 min
      });
      done(null, signedXdr);
    } catch (err) {
      this.logger.error(err);
      done(err);
    }
  }
}
