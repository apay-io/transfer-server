/* tslint:disable:variable-name */
import { TransactionType } from '../enums/transaction-type.enum';
import { IsEnum, IsInt, IsISO8601, IsNotEmpty, IsNumberString, IsOptional, IsPositive } from 'class-validator';
import { IsStellarAccount } from '../../validators/stellar-account.validator';
import { IsKnownAsset } from '../../validators/known-asset.validator';
import { IsKnownAssetIssuer } from '../../validators/known-asset-issuer.validator';
import { Transform } from 'class-transformer';

export class TransactionsFilterInternalDto {
  @IsKnownAsset()
  readonly asset_code?: string;
  @IsStellarAccount()
  @IsKnownAssetIssuer()
  @IsOptional()
  readonly asset_issuer?: string; // currently not in use, but required by the standard
  @IsStellarAccount()
  readonly account?: string;
  @IsISO8601()
  @IsOptional()
  readonly no_older_than?: Date;
  @IsInt()
  @IsPositive()
  @IsOptional()
  @Transform(value => Number(value))
  readonly limit?: number;
  @IsEnum(TransactionType)
  @IsOptional()
  readonly kind?: TransactionType;
  @IsNumberString()
  @IsOptional()
  readonly paging_id?: string;
}
