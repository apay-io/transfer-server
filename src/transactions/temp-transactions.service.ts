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

  save(dto: TxNotificationDto): Promise<TempTransaction> {
    const tempTx = this.repo.create(dto);
    return this.repo.save(tempTx);
  }

  delete(asset: string, hash: string) {
    return this.repo.delete({
      asset, hash,
    });
  }
}
