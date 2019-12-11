/* tslint:disable:variable-name */

import { IsKnownAsset } from '../../validators/known-asset.validator';
import { IsStellarAccount } from '../../validators/stellar-account.validator';
import { MemoType, MemoID, MemoText, MemoHash } from 'stellar-sdk';
import { IsIn, IsAlpha, Length, IsUrl, IsAlphanumeric, IsOptional, ValidateIf } from 'class-validator';
import { Transform } from 'class-transformer';
import { IsStellarMemo } from '../../validators/stellar-memo.validator';
import { IsKnownAssetIssuer } from '../../validators/known-asset-issuer.validator';

export class WithdrawDto {
  @IsKnownAsset()
  readonly asset_code: string;
  @IsStellarAccount()
  @IsKnownAssetIssuer()
  @IsOptional()
  readonly asset_issuer?: string; // currently not in use, but required by the standard
  @IsIn(['crypto'])
  readonly type: string;
  @IsAlphanumeric()
  @Length(2, 100)
  readonly dest: string;
  @IsAlphanumeric()
  @Length(2, 50)
  @IsOptional()
  readonly dest_extra?: string;
  @IsStellarAccount()
  @IsOptional()
  readonly account: string;
  @Transform(value => value.toLowerCase())
  @IsIn([MemoID, MemoText, MemoHash])
  @IsOptional()
  readonly memo_type?: MemoType;
  @IsStellarMemo()
  @ValidateIf(o => o.memo_type)
  readonly memo?: string;
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
