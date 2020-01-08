import { BigNumber } from 'bignumber.js';
import { TxOutput } from './dto/tx-output.dto';

export interface Wallet {

  getNewAddress(asset): Promise<string>;

  isValidDestination(asset: string, addressOut: string, addressOutExtra: string): Promise<boolean>;

  checkTransaction(asset: string, txHash: string): Promise<TxOutput[]>;

  getBalance(asset: string): Promise<BigNumber>;

  isFinalYet(value: BigNumber, confirmations: number, rateUsd: BigNumber): boolean;
}
