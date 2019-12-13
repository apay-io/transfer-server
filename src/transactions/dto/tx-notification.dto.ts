import { IsAlphanumeric } from 'class-validator';

export class TxNotificationDto {
  @IsAlphanumeric() // can be a more strict check, but need to take into account all different hashes used on different networks
  hash: string;
}
