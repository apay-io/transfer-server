import { Transaction } from './transaction.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Injectable } from '@nestjs/common';
import { TransactionsFilterDto } from './dto/transactions-filter.dto';
import { TransactionType } from './enums/transaction-type.enum';
import { TransactionFilterDto } from './dto/transaction-filter.dto';

@Injectable()
export class TransactionsService {
  constructor(
    @InjectRepository(Transaction)
    protected readonly repo: Repository<Transaction>,
  ) {
  }

  find(dto: TransactionsFilterDto): Promise<Transaction[]> {
    const builder = this.repo.createQueryBuilder()
      .where({
        asset: dto.asset_code,
      });

    if (dto.kind) {
      if (dto.kind === TransactionType.deposit) {
        builder.andWhere('Transaction.addressOut = :account', {account: dto.account});
      } else {
        builder.andWhere('Transaction.addressIn = :account', {account: dto.account});
      }
    } else {
      builder.andWhere(
        'Transaction.addressIn = :account OR Transaction.addressOut = :account',
        {account: dto.account},
      );
    }
    if (dto.paging_id) {
      builder.andWhere('Transaction.paging < :paging', {paging: dto.paging_id});
    }
    if (dto.no_older_than) {
      builder.andWhere('Transaction.createdAt > :date', {date: dto.no_older_than});
    }
    builder.orderBy('id', 'DESC');
    // default limit 50, max limit 500
    const limit = dto.limit || 50;
    builder.limit(Math.min(limit, 500));

    return builder.getMany();
  }

  findOne(dto: TransactionFilterDto): Promise<Transaction> {
    const builder = this.repo.createQueryBuilder();
    if (dto.id) {
      builder.where('Transaction.uuid = :id', { id: dto.id });
    } else if (dto.stellar_transaction_id) {
      builder.where('Transaction.txIn = :txId AND Transaction.type = :type',
        { txId: dto.stellar_transaction_id, type: TransactionType.withdrawal });
      builder.orWhere('Transaction.txOut = :txId AND Transaction.type = :type',
        { txId: dto.stellar_transaction_id, type: TransactionType.deposit });
    } else if (dto.external_transaction_id) {
      builder.where('Transaction.txIn = :txId AND Transaction.type = :type',
        { txId: dto.stellar_transaction_id, type: TransactionType.deposit });
      builder.orWhere('Transaction.txOut = :txId AND Transaction.type = :type',
        { txId: dto.stellar_transaction_id, type: TransactionType.withdrawal });
    }
    builder.limit(1);

    return builder.getOne();
  }
}
