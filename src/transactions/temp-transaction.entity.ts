import {
  Entity,
  Column,
  CreateDateColumn,
  Generated,
  PrimaryGeneratedColumn, Unique,

} from 'typeorm';
import { TransactionType } from './enums/transaction-type.enum';

/**
 * Entity to store tx hashes passed through webhooks
 * Requires verification by our node before putting into the main table
 * Saving to make sure we don't miss webhooks if queue goes bust
 */
@Entity()
@Unique(['asset', 'hash'])
export class TempTransaction {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({type: 'uuid', nullable: false})
  @Generated('uuid')
  uuid: string; // still thinking whether it's required, can be used as id of incomplete tx

  @Column({length: 255, nullable: false})
  hash: string;

  @Column({length: 255, nullable: false})
  asset: string;

  @Column({length: 255, nullable: true})
  account: string;

  @Column({
    type: 'enum',
    enum: [
      TransactionType.deposit,
      TransactionType.withdrawal,
    ],
    default: TransactionType.deposit,
  })
  type: TransactionType;

  @CreateDateColumn()
  createdAt: Date;
}
