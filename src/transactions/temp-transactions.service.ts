import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { TempTransaction } from './temp-transaction.entity';
import { Repository } from 'typeorm';
import { TxNotificationDto } from './dto/tx-notification.dto';
import { TransactionsFilterDto } from './dto/transactions-filter.dto';
import { TransactionFilterDto } from './dto/transaction-filter.dto';

@Injectable()
export class TempTransactionsService {
  constructor(
    @InjectRepository(TempTransaction)
    protected readonly repo: Repository<TempTransaction>,
  ) {
  }

  save(dto: TxNotificationDto): Promise<TempTransaction> {
    const tempTx = this.repo.create(dto);
    return this.repo.save(tempTx);
  }

  delete(asset: string, hash: string) {
    return this.repo.delete({
      asset, hash,
    });
  }

  getTxById(dto: TransactionFilterDto): Promise<TempTransaction> {
    const builder = this.repo.createQueryBuilder();
    if (dto.id) {
      builder.where('TempTransaction.uuid = :id', { id: dto.id });
    } else if (dto.stellar_transaction_id) {
      builder.where('TempTransaction.hash = :txId', { txId: dto.stellar_transaction_id });
    } else if (dto.external_transaction_id) {
      builder.where('TempTransaction.hash = :txId', { txId: dto.external_transaction_id });
    }
    builder.limit(1);

    return builder.getOne();
  }

  async find(dto: TransactionsFilterDto) {
    const builder = this.repo.createQueryBuilder().where('1 = 1');

    if (dto.asset_code) {
      builder.andWhere('TempTransaction.asset = :asset', {
        asset: dto.asset_code,
      });
    }

    if (dto.account) {
      builder.andWhere('TempTransaction.account = :account', {account: dto.account});
    }
    if (dto.kind) {
      builder.andWhere('TempTransaction.type = :type', { type: dto.kind })
    }
    if (dto.no_older_than) {
      builder.andWhere('TempTransaction.createdAt > :date', {date: dto.no_older_than});
    }
    builder.orderBy('id', 'DESC');
    // default limit 50, max limit 500
    const limit = dto.limit || 50;
    builder.limit(Math.min(limit, 500));

    return builder.getMany();
  }
}
