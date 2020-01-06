import { IsAlphanumeric, IsEnum, IsOptional } from 'class-validator';
import { TransactionChain } from '../enums/transaction-chain.enum';

export class TxNotificationDto {
  @IsEnum(TransactionChain)
  @IsOptional()
  chain?: TransactionChain;
  @IsAlphanumeric() // can be a more strict check, but need to take into account all different hashes used on different networks
  hash: string;
}
