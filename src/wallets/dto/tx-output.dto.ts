import { BigNumber } from 'bignumber.js';

export class TxOutput {
  asset: string;
  txIn: string;
  txInIndex: number;
  addressFrom: string;
  addressIn: string;
  addressInExtra?: number;
  value: BigNumber;
  confirmations: number;
}
