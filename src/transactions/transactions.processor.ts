import { InjectQueue, Process, Processor } from '@nestjs/bull';
import { DoneCallback, Job, Queue } from 'bull';
import { Logger } from '@nestjs/common';
import { Transaction } from './transaction.entity';
import { ConfigService, InjectConfig } from 'nestjs-config';
import { TransactionLogsService } from './transaction-logs.service';
import { TransactionLog } from './transaction-log.entity';
import { BigNumber } from 'bignumber.js';
import { WalletFactoryService } from '../wallets/wallet-factory.service';
import { TransactionType } from './enums/transaction-type.enum';
import { TransactionsService } from './transactions.service';

/**
 * Worker responsible for preparing transactions for signing
 * Doesn't matter if executed multiple times, sequence has already been defined
 */
@Processor('transactions')
export class TransactionsProcessor {
  private readonly logger = new Logger(TransactionsProcessor.name);

  constructor(
    @InjectConfig()
    private readonly config: ConfigService,
    private readonly walletFactoryService: WalletFactoryService,
    private readonly transactionsService: TransactionsService,
    private readonly transactionLogsService: TransactionLogsService,
    @InjectQueue('sign') readonly signQueue: Queue,
  ) {}

  @Process()
  async process(job: Job<{ txs: Transaction[] }>, done: DoneCallback) {
    this.logger.log(job.data);

    try {
      // assuming channel and sequence should be the same for all txs
      const type = job.data.txs[0].type;
      const asset = job.data.txs[0].asset;
      const { walletOut } = this.walletFactoryService.get(type, asset);
      const {channel, sequence} = job.data.txs[0].channel && job.data.txs[0].sequence
        ? job.data.txs[0]
        : await walletOut.getChannelAndSequence(
          asset, `${job.data.txs[0].txIn}:${job.data.txs[0].txInIndex}`, (new Date()).getTime().toString(10),
        );
      if (!job.data.txs[0].channel || !job.data.txs[0].sequence) {
        this.logger.debug({channel, sequence});
        await this.transactionsService.assignSequence(job.data.txs, channel, sequence);
      }

      const txLog = await this.transactionLogsService.save({
        state: 'building',
        channel,
        sequence,
      } as TransactionLog);
      // it throws here if such record already exists
      this.logger.log(txLog);

      let totalChange = new BigNumber(0);
      job.data.txs.forEach((tx: Transaction) => {
        totalChange = totalChange.add(tx.amountOut);
      });
      const result = await walletOut.buildPaymentTx({
        recipients: job.data.txs.map((item: Transaction) => {
          return {
            addressOut: item.addressOut,
            addressOutExtra: item.mapping.addressOutExtra,
            addressOutExtraType: item.depositMapping ? item.depositMapping.addressOutExtraType : null,
            amount: item.amountOut,
            asset: item.asset,
          };
        }),
        channel,
        sequence: new BigNumber(sequence),
      });

      this.logger.log(result);

      // todo: save txOut hash here if available
      await this.transactionLogsService.save(Object.assign(txLog, {
        processedAt: new Date(),
        output: result,
      }));
      await this.signQueue.add({
        channel,
        sequence,
        xdr: result.rawTx,
        asset,
        type,
        totalChange: totalChange.toString(10),
      }, {
        ...this.config.get('queue').defaultJobOptions(),
      });

      done(null, result);
    } catch (err) {
      throw err;
      // done(err);
    }
  }
}
