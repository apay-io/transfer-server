/* tslint:disable:variable-name */

import { IsNotEmpty} from 'class-validator';
import { MemoType } from 'stellar-sdk';

export class WithdrawalResponseDto {
  // todo: transaction id ?
  @IsNotEmpty()
  readonly account_id: string;
  readonly memo_type?: MemoType;
  readonly memo?: string;
  readonly eta: number;
  readonly min_amount: number;
  readonly max_amount: number;
  readonly fee_fixed: number;
  readonly fee_percent: number;
  readonly extra_info?: any;
}
