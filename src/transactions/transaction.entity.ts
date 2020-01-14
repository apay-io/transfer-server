import {
  Entity,
  Column,
  CreateDateColumn,
  Generated,
  PrimaryGeneratedColumn, Unique, ManyToOne, OneToMany,

} from 'typeorm';
import { BigNumber } from 'bignumber.js';
import { BigNumberToStringTransformer } from '../transformers/bignumber-to-string.transformer';
import { TrimStringTransformer } from '../transformers/trim-string.transformer';
import { TransactionState } from './enums/transaction-state.enum';
import { TransactionType } from './enums/transaction-type.enum';
import { TransactionLog } from './transaction-log.entity';
import { AddressMapping } from '../non-interactive/address-mapping.entity';
import { DepositMapping } from '../non-interactive/address-mapping.entity';

// for the best results add this trigger to the database, which makes sure you can't override fields after setting initial value
// for other fields privileges should allow only insert
// only state can be modified, it shouldn't ruin much, but eventually we can check in trigger that it's modified only forward
//
// CREATE FUNCTION prevent_override() RETURNS trigger AS $prevent_override$
// BEGIN
// IF NEW.txOut IS NOT NULL AND OLD.txOut IS NOT NULL THEN
// RAISE EXCEPTION 'cannot override txOut';
// END IF;
// IF NEW.channel IS NOT NULL AND OLD.channel IS NOT NULL THEN
// RAISE EXCEPTION 'cannot override channel';
// END IF;
// IF NEW.sequence IS NOT NULL AND OLD.sequence IS NOT NULL THEN
// RAISE EXCEPTION 'cannot override sequence';
// END IF;
// IF NEW.refunded IS NOT NULL AND OLD.refunded IS NOT NULL THEN
// RAISE EXCEPTION 'cannot override refunded';
// END IF;
//
// RETURN NEW;
// END;
// $prevent_override$ LANGUAGE plpgsql;
//
// CREATE TRIGGER prevent_override BEFORE UPDATE ON transaction
// FOR EACH ROW EXECUTE PROCEDURE prevent_override();

@Entity()
@Unique(['txIn', 'txInIndex'])
@Unique(['channel', 'sequence'])
export class Transaction {
  @PrimaryGeneratedColumn()
  id?: number;

  @Column({type: 'uuid', nullable: false})
  @Generated('uuid')
  uuid?: string;

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
  state: TransactionState; // can be updated

  @Column({length: 255, nullable: false})
  txIn: string;

  @Column({nullable: true})
  txInIndex: number;

  @Column({length: 255, nullable: true})
  txOut?: string; // can be updated once

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
  addressInExtra?: string;

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
  createdAt?: Date;

  @Column({
    length: 255,
    nullable: true,
  })
  channel?: string;

  @Column({
    length: 255,
    nullable: true,
  })
  sequence?: string;

  @Column({
    length: 255,
    nullable: true,
  })
  paging?: string; // can be updated once

  @Column({ type: 'boolean', default: false })
  refunded: boolean; // can be updated once

  @ManyToOne(type => AddressMapping, mapping => mapping.transactions, {
    eager: true, persistence: true,
  })
  mapping: AddressMapping;

  @ManyToOne(type => DepositMapping, mapping => mapping.transactions, {
    eager: true, persistence: true,
  })
  depositMapping: DepositMapping;

  @OneToMany(type => TransactionLog, log => log.transaction, {
    eager: true, persistence: true,
  })
  logs?: TransactionLog[];
}
