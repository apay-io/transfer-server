import { IsNull, Repository, Not } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Injectable } from '@nestjs/common';
import { TransactionLog } from './transaction-log.entity';

@Injectable()
export class TransactionLogsService {
  constructor(
    @InjectRepository(TransactionLog)
    protected readonly repo: Repository<TransactionLog>,
  ) {
  }

  save(entity: TransactionLog) {
    return this.repo.save(entity);
  }
}
