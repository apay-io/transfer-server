/* tslint:disable:variable-name */

import { IsKnownAsset } from '../../validators/known-asset.validator';
import { IsStellarAccount } from '../../validators/stellar-account.validator';
import { MemoType, MemoNone, MemoID, MemoText, MemoHash, MemoReturn } from 'stellar-sdk';
import {
  IsIn,
  IsEmail,
  IsAlpha,
  Length,
  IsUrl,
  IsAlphanumeric,
  IsOptional,
  ValidateIf,
  IsPositive, IsNumberString
} from 'class-validator';
import { Transform } from 'class-transformer';
import { IsStellarMemo } from '../../validators/stellar-memo.validator';
import { IsKnownAssetIssuer } from '../../validators/known-asset-issuer.validator';

export class DepositDto {
  @IsKnownAsset()
  readonly asset_code: string;
  @IsStellarAccount()
  @IsKnownAssetIssuer()
  @IsOptional()
  readonly asset_issuer?: string; // currently not in use, but required by the standard
  @IsNumberString()
  @IsPositive()
  @IsOptional()
  readonly amount?: number;
  @IsStellarAccount()
  readonly account: string;
  @Transform(value => value.toLowerCase())
  @IsIn([MemoNone, MemoID, MemoText, MemoHash, MemoReturn])
  @IsOptional()
  readonly memo_type?: MemoType;
  @IsStellarMemo()
  @ValidateIf(o => o.memo_type)
  readonly memo?: string;
  @IsEmail()
  @IsOptional()
  readonly email_address?: string;
  @IsAlpha()
  @Length(2, 50)
  @IsOptional()
  readonly type?: string;
  @IsAlphanumeric()
  @Length(2, 50)
  @IsOptional()
  readonly wallet_name?: string;
  @IsUrl()
  @IsOptional()
  readonly wallet_url?: string;
  @IsAlpha()
  @Length(2, 2)
  @IsOptional()
  readonly lang?: string;
}
