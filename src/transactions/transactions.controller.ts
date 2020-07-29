import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  Get,
  Logger, 
  NotFoundException,
  Param,
  Post,
  Query,
  Req,
  Res,
  UseGuards
} from '@nestjs/common';
import { TransactionsFilterDto } from './dto/transactions-filter.dto';
import { TransactionsService } from './transactions.service';
import { TransactionDto } from './dto/transaction.dto';
import { Transaction } from './transaction.entity';
import { TransactionFilterDto } from './dto/transaction-filter.dto';
import { TxNotificationDto } from './dto/tx-notification.dto';
import { TempTransactionsService } from './temp-transactions.service';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { TransactionType } from './enums/transaction-type.enum';
import { ConfigService } from '@nestjs/config';
import { TransactionState } from './enums/transaction-state.enum';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { TempTransaction } from './temp-transaction.entity';

@Controller()
export class TransactionsController {
  private readonly logger = new Logger(TransactionsController.name);

  constructor(
    private readonly config: ConfigService,
    private readonly tempTransactionsService: TempTransactionsService,
    private readonly transactionsService: TransactionsService,
    @InjectQueue('temp-transactions') readonly tempQueue: Queue,
  ) {
  }

  @Get('sep-0006/transactions')
  async getTransactionsSep6(
    @Query() transactionsFilterDto: TransactionsFilterDto,
  ): Promise<{ transactions: TransactionDto[]}> {
    if (!transactionsFilterDto.account) {
      throw new BadRequestException(`Stellar account undefined is not valid`);
    }
    return this.getTransactionsInternal(transactionsFilterDto);
  }

  @Get('transactions')
  @UseGuards(JwtAuthGuard)
  async getTransactions(
    @Req() req,
    @Query() transactionsFilterDto: TransactionsFilterDto,
  ): Promise<{ transactions: TransactionDto[]}> {
    transactionsFilterDto.account = req.user.sub;
    return this.getTransactionsInternal(transactionsFilterDto);
  }

  async getTransactionsInternal(
    transactionsFilterDto: TransactionsFilterDto,
  ): Promise<{ transactions: TransactionDto[]}> {
    const txs = await this.transactionsService.find(transactionsFilterDto);
    const tempTxs = await this.tempTransactionsService.find(transactionsFilterDto);

    const result = tempTxs.map((tempTx: TempTransaction) => {
      return this.tempTxToTransactionDto(tempTx);
    }).concat(txs.map((tx: Transaction) => {
      return this.txToTransactionDto(tx);
    }));

    return {
      transactions: result,
    };
  }

  @Get('sep-0006/transaction')
  getTransactionSep6(
    @Query() transactionFilterDto: TransactionFilterDto,
  ): Promise<{ transaction: TransactionDto}> {
    return this.getTransactionInternal(transactionFilterDto);
  }

  @Get('transaction')
  @UseGuards(JwtAuthGuard)
  getTransaction(
    @Req() req,
    @Query() transactionFilterDto: TransactionFilterDto,
  ): Promise<{ transaction: TransactionDto}> {
    return this.getTransactionInternal(transactionFilterDto);
  }

  async getTransactionInternal(
    transactionFilterDto: TransactionFilterDto,
  ): Promise<{ transaction: TransactionDto}> {
    return this.getTransactionInternal(transactionFilterDto, response);
  }

  async getTransactionInternal(
    transactionFilterDto: TransactionFilterDto,
    response,
  ): Promise<{ transaction: TransactionDto}> {
    if (
      !transactionFilterDto.id
      && !transactionFilterDto.stellar_transaction_id
      && !transactionFilterDto.external_transaction_id
    ) {
      throw new BadRequestException(
        'At least one filter must be specified id, stellar_transaction_id or external_transaction_id'
      );
    }
    const tx = await this.transactionsService.getTxById(transactionFilterDto);
    if (!tx) {
      const tempTx = await this.tempTransactionsService.getTxById(transactionFilterDto)
      if (tempTx) {
        return {
          transaction: this.tempTxToTransactionDto(tempTx)
        };
      }
      throw new NotFoundException('Transaction not found');
    }
    return {
      transaction: this.txToTransactionDto(tx),
    };
  }

  /**
   * This endpoint is for internal use only.
   * It is not safe to have it exposed to the internet, that's why we require a secret
   * Notifies system about incoming tx. We're saving tx into temp pool until our node confirms it's valid
   * @param asset - chain code, valid values are btc, xlm, eth and other
   * @param secret
   * @param txNotificationDto must contain tx hash
   */
  @Post('notify/:asset/:secret')
  async notify(
    @Param('asset') asset: string,
    @Param('secret') secret: string,
    @Body() txNotificationDto: TxNotificationDto,
  ) {
    if (this.config.get('app').notificationSecrets.indexOf(secret) === -1) {
      throw new ForbiddenException('Invalid secret');
    }
    if (asset !== 'xlm') {
      txNotificationDto.type = TransactionType.deposit;
      txNotificationDto.asset = asset.toUpperCase();
    }
    try {
      await this.tempTransactionsService.save(txNotificationDto);
    } catch (err) {
      if (err.message.includes('duplicate')) {
        // all good
      } else {
        this.logger.error(err);
      }
    }
    await this.tempQueue.add(txNotificationDto, {
      attempts: 5,
      backoff: 10000, // 10 seconds
      ...this.config.get('queue').defaultJobOptions,
      timeout: 60000 * 5, // 5 min
    });
  }

  private txToTransactionDto(tx: Transaction) {
    const lastLog = tx.logs.find((item) => item.state === 'submitting');
    return {
      id: tx.uuid,
      kind: tx.type,
      status: tx.state,
      amount_in: tx.amountIn.toFixed(7),
      amount_out: tx.amountOut.toFixed(7),
      amount_fee: tx.amountFee.toFixed(7),
      started_at: tx.createdAt,
      completed_at: lastLog.processedAt,
      stellar_transaction_id: (tx.type === TransactionType.deposit ? tx.txOut : tx.txIn),
      refunded: tx.refunded,
      from: tx.addressFrom,
      to: tx.addressOut,
      more_info_url: this.config.get<string>('app.frontUrl') + `/tx/${tx.uuid}`,

      ...(tx.type === TransactionType.deposit ? {} : {
        withdraw_anchor_account: tx.addressIn,
        withdraw_memo: tx.addressInExtra,
        withdraw_memo_type: 'id',
      })
    } as TransactionDto;
  }

  private tempTxToTransactionDto(tempTx: TempTransaction) {
    return {
      id: tempTx.uuid,
      kind: tempTx.type,
      status: TransactionState.incomplete,
      amount_in: null,
      amount_out: null,
      amount_fee: null,
      started_at: tempTx.createdAt,
      completed_at: null,
      stellar_transaction_id: null,
      refunded: false,
      from: null,
      to: null,
      more_info_url: this.config.get<string>('app.frontUrl') + `/tx/${tempTx.uuid}`,

      ...(tempTx.type === TransactionType.deposit ? {} : {
        withdraw_anchor_account: null,
        withdraw_memo: null,
        withdraw_memo_type: 'id',
      })
    } as TransactionDto;
  }
}
