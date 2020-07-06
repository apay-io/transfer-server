import { IsString } from 'class-validator';
import { IsStellarTx } from '../../validators/stellar-tx.validator';

export class TokenRequest {
  @IsString()
  @IsStellarTx()
  readonly transaction: string;
}
