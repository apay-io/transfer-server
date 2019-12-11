import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { TempTransaction } from './temp-transaction.entity';
import { Repository } from 'typeorm';
import { TxNotificationDto } from './dto/tx-notification.dto';

@Injectable()
export class TempTransactionsService {
  constructor(
    @InjectRepository(TempTransaction)
    protected readonly repo: Repository<TempTransaction>,
  ) {
  }

  save(chain: string, dto: TxNotificationDto): Promise<TempTransaction> {
    const tempTx = this.repo.create({
      chain,
      hash: dto.hash,
    });
    return this.repo.save(tempTx);
  }
}
