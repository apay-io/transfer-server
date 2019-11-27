import {
  Entity,
  Column,
  CreateDateColumn,
  Generated,
  PrimaryGeneratedColumn,

} from 'typeorm';
import { BigNumber } from 'bignumber.js';
import { BigNumberToStringTransformer } from '../transformers/bignumber-to-string.transformer';
import { TrimStringTransformer } from '../transformers/trim-string.transformer';
import { TransactionState } from './enums/transaction-state.enum';
import { TransactionType } from './enums/transaction-type.enum';

@Entity()
export class Transaction {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({type: 'uuid', nullable: false})
  @Generated('uuid')
  uuid: string;

  @Column({
    type: 'enum',
    enum: [
      TransactionType.deposit,
      TransactionType.withdrawal,
    ],
    default: TransactionType.deposit,
  })
  type: string;

  @Column({
    type: 'enum',
    enum: [
      TransactionState.incomplete,
      TransactionState.pending_user_transfer_start,
      TransactionState.pending_external,
      TransactionState.pending_stellar,
      TransactionState.pending_user,
      TransactionState.pending_anchor,
      TransactionState.pending_trust,
      TransactionState.completed,
      TransactionState.no_market,
      TransactionState.too_small,
      TransactionState.too_large,
      TransactionState.error,
    ],
    default: TransactionState.incomplete,
  })
  state: string; // can be updated

  @Column({length: 255, nullable: false})
  txIn: string;

  @Column({nullable: true})
  txInIndex: number;

  @Column({length: 255, nullable: true})
  txOut: string; // can be updated

  @Column({
    length: 255,
    nullable: false,
  })
  addressFrom: string;

  @Column({
    length: 255,
    nullable: false,
  })
  addressIn: string;

  @Column({
    length: 255,
    nullable: true,
    transformer: new TrimStringTransformer(),
  })
  addressInExtra: string;

  @Column({
    length: 255,
    nullable: false,
  })
  addressOut: string;

  @Column({
    length: 255,
    nullable: true,
    transformer: new TrimStringTransformer(),
  })
  addressOutExtra: string;

  @Column({length: 255, nullable: false})
  asset: string;

  @Column({
    type: 'decimal',
    precision: 18,
    scale: 12,
    transformer: new BigNumberToStringTransformer(),
    nullable: false,
  })
  amountIn: BigNumber;

  @Column({
    type: 'decimal',
    precision: 18,
    scale: 12,
    transformer: new BigNumberToStringTransformer(),
    nullable: false,
  })
  amountFee: BigNumber;

  @Column({
    type: 'decimal',
    precision: 18,
    scale: 12,
    transformer: new BigNumberToStringTransformer(),
    nullable: false,
  })
  amountOut: BigNumber;

  @Column({
    type: 'decimal',
    precision: 18,
    scale: 12,
    transformer: new BigNumberToStringTransformer(),
    nullable: false,
  })
  rateUsd: BigNumber;

  @CreateDateColumn()
  createdAt: Date;

  @Column({
    length: 255,
    nullable: true,
  })
  paging: string;

  @Column({ type: 'boolean' })
  refunded: boolean;
}
