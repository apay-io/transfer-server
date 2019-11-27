/* tslint:disable:variable-name */
import { IsHash, IsOptional, IsUUID, ValidateIf } from 'class-validator';

export class TransactionFilterDto {
  @IsUUID()
  @IsOptional()
  readonly id: string;
  @IsHash('sha256')
  @IsOptional()
  readonly stellar_transaction_id: string;
  @IsHash('sha256')
  @IsOptional()
  readonly external_transaction_id: string;
}
