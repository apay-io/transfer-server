import { Controller, Get, Query, Res } from '@nestjs/common';
import { ConfigService, InjectConfig } from 'nestjs-config';
import { TransactionsFilterDto } from './dto/transactions-filter.dto';
import { TransactionsService } from './transactions.service';
import { TransactionDto } from './dto/transaction.dto';
import { Transaction } from './transaction.entity';
import { TransactionFilterDto } from './dto/transaction-filter.dto';

@Controller()
export class TransactionsController {
  constructor(
    @InjectConfig()
    private readonly config: ConfigService,
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
      return response.status(404).send({
        error: 'Transaction not found',
      });
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
}
