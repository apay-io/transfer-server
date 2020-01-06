import {
  Entity,
  Column,
  CreateDateColumn,
  PrimaryGeneratedColumn, OneToMany,
} from 'typeorm';
import { TrimStringTransformer } from '../transformers/trim-string.transformer';
import { MemoType, MemoReturn, MemoHash, MemoText, MemoID } from 'stellar-sdk';
import { Transaction } from '../transactions/transaction.entity';

@Entity()
export class DepositMapping {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    length: 255,
    nullable: false,
  })
  addressIn: string;

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

  @Column({
    type: 'enum',
    enum: [
      MemoID,
      MemoText,
      MemoHash,
      MemoReturn,
    ],
    nullable: true,
  })
  addressOutExtraType: MemoType;

  @Column({length: 255, nullable: false})
  asset: string;

  @CreateDateColumn()
  createdAt: Date;

  @Column({
    length: 255,
    nullable: true,
  })
  email: string;

  @OneToMany(type => Transaction, tx => tx.mapping, {
    lazy: true,
  })
  transactions: Transaction[];
}
