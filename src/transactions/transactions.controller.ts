import { Body, Controller, ForbiddenException, Get, Logger, Param, Post, Query, Res } from '@nestjs/common';
import { ConfigService, InjectConfig } from 'nestjs-config';
import { TransactionsFilterDto } from './dto/transactions-filter.dto';
import { TransactionsService } from './transactions.service';
import { TransactionDto } from './dto/transaction.dto';
import { Transaction } from './transaction.entity';
import { TransactionFilterDto } from './dto/transaction-filter.dto';
import { TxNotificationDto } from './dto/tx-notification.dto';
import { TempTransactionsService } from './temp-transactions.service';
import { InjectQueue } from 'nest-bull';
import { Queue } from 'bull';
import { TransactionChain } from './enums/transaction-chain.enum';

@Controller()
export class TransactionsController {
  private readonly logger = new Logger(TransactionsController.name);

  constructor(
    @InjectConfig()
    private readonly config: ConfigService,
    private readonly tempTransactionsService: TempTransactionsService,
    private readonly transactionsService: TransactionsService,
    @InjectQueue('temp-transactions') readonly queue: Queue,
  ) {
  }

  @Get('transactions')
  async getTransactions(
    @Query() transactionsFilterDto: TransactionsFilterDto,
  ): Promise<{ transactions: TransactionDto[]}> {
    const txs = await this.transactionsService.find(transactionsFilterDto);
    return {
      transactions: txs.map((tx: Transaction) => {
        return {
          id: tx.uuid,
          kind: tx.type,
          status: tx.state,
          // status_eta:

        } as TransactionDto;
      }),
    };
  }

  @Get('transaction')
  async getTransaction(
    @Query() transactionFilterDto: TransactionFilterDto,
    @Res() response,
  ): Promise<{ transaction: TransactionDto}> {
    if (
      !transactionFilterDto.id
      && !transactionFilterDto.stellar_transaction_id
      && !transactionFilterDto.external_transaction_id
    ) {
      return response.status(400).send({
        error: 'At least one filter must be specified id, stellar_transaction_id or external_transaction_id',
      });
    }
    const tx = await this.transactionsService.findOne(transactionFilterDto);
    if (!tx) {
      return response.status(404);
    }
    return {
      transaction: {
        id: tx.uuid,
        kind: tx.type,
        status: tx.state,
        // status_eta:

      } as TransactionDto,
    };
  }

  /**
   * This endpoint is for internal use only.
   * It is not safe to have it exposed to the internet, that's why we require a secret
   * Notifies system about incoming tx. We're saving tx into temp pool until our node confirms it's valid
   * @param chain - chain code, valid values are btc, xlm, eth and other
   * @param secret
   * @param txNotificationDto must contain tx hash
   */
  @Post('notify/:chain/:secret')
  async notify(
    @Param('chain') chain: TransactionChain,
    @Param('secret') secret: string,
    @Body() txNotificationDto: TxNotificationDto,
  ) {
    if (this.config.get('app').notificationSecrets.indexOf(secret) === -1) {
      throw new ForbiddenException('Invalid secret');
    }
    txNotificationDto.chain = chain;
    try {
      await this.tempTransactionsService.save(txNotificationDto);
    } catch (err) {
      if (err.message.includes('duplicate')) {
        // all good
      } else {
        this.logger.error(err);
      }
    }
    await this.queue.add(txNotificationDto, {
      attempts: 5,
      backoff: 10000, // 10 seconds
      ...this.config.get('queue').defaultJobOptions,
      timeout: 60000 * 5, // 5 min
    });
  }
}
