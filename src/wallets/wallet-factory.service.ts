import { Injectable } from '@nestjs/common';
import { ConfigService, InjectConfig } from 'nestjs-config';
import { StellarService } from './stellar.service';
import { Wallet } from './wallet.interface';
import { TransactionType } from '../transactions/enums/transaction-type.enum';

@Injectable()
export class WalletFactoryService {

  constructor(
    @InjectConfig()
    readonly config: ConfigService,
    readonly stellarDriver: StellarService,
  ) {
  }

  get(type: TransactionType, assetCode: string): { walletIn: Wallet, walletOut: Wallet } {
    const wallet: Wallet = null;
    return {
      walletIn: type === TransactionType.deposit ? wallet : this.stellarDriver,
      walletOut: type === TransactionType.withdrawal ? wallet : this.stellarDriver,
    };
  }
}
