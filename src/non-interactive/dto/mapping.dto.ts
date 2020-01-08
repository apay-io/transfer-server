/* tslint:disable:variable-name */

import { IsKnownAsset } from '../../validators/known-asset.validator';
import { MemoType, MemoNone, MemoID, MemoText, MemoHash, MemoReturn } from 'stellar-sdk';
import { IsIn, IsEmail, IsOptional, ValidateIf } from 'class-validator';
import { Transform } from 'class-transformer';
import { IsStellarMemo } from '../../validators/stellar-memo.validator';

export class MappingDto {
  @IsKnownAsset()
  readonly asset: string;
  readonly addressOut: string;
  @Transform(value => value.toLowerCase())
  @IsIn([MemoNone, MemoID, MemoText, MemoHash, MemoReturn])
  @IsOptional()
  readonly addressOutExtraType?: MemoType;
  @IsStellarMemo()
  @ValidateIf(o => o.memo_type)
  readonly addressOutExtra?: string;
  @IsEmail()
  @IsOptional()
  readonly email?: string;
}
