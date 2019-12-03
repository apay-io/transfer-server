/* tslint:disable:variable-name */

import { IsNotEmpty} from 'class-validator';

export class DepositResponseDto {
  @IsNotEmpty()
  readonly how: string;
  readonly eta: number;
  readonly min_amount: number;
  readonly max_amount: number;
  readonly fee_fixed: number;
  readonly fee_percent: number;
  readonly extra_info: any;
}
