import { Body, Controller, ForbiddenException, Get, Param, Post, Query, Res } from '@nestjs/common';
import { ConfigService, InjectConfig } from 'nestjs-config';
import { TransactionsFilterDto } from './dto/transactions-filter.dto';
import { TransactionsService } from './transactions.service';
import { TransactionDto } from './dto/transaction.dto';
import { Transaction } from './transaction.entity';
import { TransactionFilterDto } from './dto/transaction-filter.dto';
import { TxNotificationDto } from './dto/tx-notification.dto';
import { TempTransactionsService } from './temp-transactions.service';

@Controller()
export class TransactionsController {
  constructor(
    @InjectConfig()
    private readonly config: ConfigService,
    private readonly tempTransactionsService: TempTransactionsService,
    private readonly transactionsService: TransactionsService,
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
    @Param('chain') chain: string,
    @Param('secret') secret: string,
    @Body() txNotificationDto: TxNotificationDto,
  ) {
    if (this.config.get('app').notificationSecrets.indexOf(secret) === -1) {
      throw new ForbiddenException('Invalid secret');
    }
    return this.tempTransactionsService.save(
      chain,
      txNotificationDto,
    );
  }
}
