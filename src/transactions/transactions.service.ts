import { Transaction } from './transaction.entity';
import { In, IsNull, LessThan, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { TransactionsFilterDto } from './dto/transactions-filter.dto';
import { TransactionType } from './enums/transaction-type.enum';
import { TransactionFilterDto } from './dto/transaction-filter.dto';
import { TransactionState } from './enums/transaction-state.enum';
import { ConfigService, InjectConfig } from 'nestjs-config';
import { BigNumber } from 'bignumber.js';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import * as groupBy from 'lodash.groupby';
import { AssetInterface } from '../interfaces/asset.interface';
import { TransactionsFilterInternalDto } from './dto/transactions-filter-internal.dto';

@Injectable()
export class TransactionsService implements OnApplicationBootstrap {
  constructor(
    @InjectConfig()
    private readonly config: ConfigService,
    @InjectRepository(Transaction)
    protected readonly repo: Repository<Transaction>,
    @InjectQueue('transactions')
    protected readonly txQueue: Queue,
  ) {
  }

  findOne(params): Promise<Transaction> {
    return this.repo.findOne(params);
  }

  find(dto: TransactionsFilterInternalDto): Promise<Transaction[]> {
    const builder = this.repo.createQueryBuilder().where('1 = 1');

    if (dto.asset_code) {
      builder.andWhere('Transaction.asset = :asset', {
        asset: dto.asset_code,
      });
    }

    if (dto.account) {
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

  getTxById(dto: TransactionFilterDto): Promise<Transaction> {
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

  async save(entity: Transaction) {
    try {
      return await this.repo.save(entity);
    } catch (err) {
      if (err.message.includes('duplicate')) {
        // if already exists - just update the state
        return this.repo.update({
          txIn: entity.txIn,
          txInIndex: entity.txInIndex,
          state: In([TransactionState.pending_external, TransactionState.pending_trust]),
        }, {
          state: entity.state,
        });
      } else {
        throw err;
      }
    }
  }

  updateState(entity: { channel: string, sequence: string }, fromState: TransactionState, toState: TransactionState) {
    return this.repo.update({
      channel: entity.channel,
      sequence: entity.sequence,
      state: fromState,
    }, {
      state: toState,
    });
  }

  /**
   * Creates intervals to pull all pending withdrawals from DB and put them into processing queue
   */
  onApplicationBootstrap() {
    const batchingAssets = this.config.get('assets').raw.filter((item) => item.withdrawalBatching);

    for (const assetConfig of batchingAssets) {
      setInterval(async () => {
        await this.enqueuePendingWithdrawals(assetConfig);
      }, assetConfig.withdrawalBatching);
    }
  }

  async enqueuePendingWithdrawals(assetConfig: AssetInterface) {
    const pendingWithdrawals = await this.repo.find({
      type: TransactionType.withdrawal,
      asset: assetConfig.code,
      state: In([TransactionState.pending_anchor]),
      sequence: IsNull(),
    });
    if (pendingWithdrawals.length) {
      await this.txQueue.add({ txs: pendingWithdrawals }, {
        ...this.config.get('queue').defaultJobOptions,
      });
    }
  }

  findPendingTrustline(asset: string, trustlines: string[]): Promise<Transaction[]> {
    return this.repo.find({
      asset,
      addressOut: In(trustlines),
      state: TransactionState.pending_trust,
    });
  }

  async assignSequence(txs: Transaction[], channel: string, sequence: string) {
    const ids = txs.map((tx) => tx.id);
    return this.repo.update({
      id: In(ids),
    }, {
      channel, sequence,
    });
  }
}
