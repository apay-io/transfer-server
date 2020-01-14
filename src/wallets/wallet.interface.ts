import { BigNumber } from 'bignumber.js';
import { TxOutput } from './dto/tx-output.dto';
import { MemoType } from 'stellar-sdk';

export interface Wallet {

  buildPaymentTx(params: {
    recipients: Array<{
      addressOut: string,
      addressOutExtra: string,
      addressOutExtraType: MemoType,
      amount: BigNumber,
      asset: string,
    }>,
    channel: string,
    sequence: BigNumber,
  }): Promise<{ hash: string, rawTx: string }>;

  sign(rawTx: string, asset: string): Promise<string>;

  submit(rawTx: string, asset: string): Promise<any>;

  getNewAddress(asset): Promise<string>;

  isValidDestination(asset: string, addressOut: string, addressOutExtra: string): Promise<boolean>;

  checkTransaction(asset: string, txHash: string): Promise<TxOutput[]>;

  getBalance(asset: string): Promise<BigNumber>;

  isFinalYet(value: BigNumber, confirmations: number, rateUsd: BigNumber): boolean;

  getChannelAndSequence(asset: string, channelInput: string, sequenceInput: string): Promise<{ channel: string, sequence: string }>;
}
