import { IsAlphanumeric, IsEnum, IsOptional } from 'class-validator';
import { TransactionType } from '../enums/transaction-type.enum';

export class TxNotificationDto {
  @IsEnum(TransactionType)
  @IsOptional()
  type?: TransactionType;
  @IsOptional()
  asset?: string;
  @IsAlphanumeric() // can be a more strict check, but need to take into account all different hashes used on different networks
  hash: string;
}
