import {
  Entity,
  Column,
  CreateDateColumn,
  PrimaryGeneratedColumn, OneToMany, TableInheritance, ChildEntity,
} from 'typeorm';
import { TrimStringTransformer } from '../transformers/trim-string.transformer';
import { Transaction } from '../transactions/transaction.entity';
import { MemoHash, MemoID, MemoReturn, MemoText, MemoType } from 'stellar-sdk';

@Entity()
@TableInheritance({ column: { type: 'varchar', name: 'type' } })
export class AddressMapping {
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

  @Column({length: 255, nullable: false})
  asset: string;

  @CreateDateColumn()
  createdAt: Date;

  @OneToMany(type => Transaction, tx => tx.mapping, {
    lazy: true,
  })
  transactions: Transaction[];
}

// tslint:disable-next-line:max-classes-per-file
@ChildEntity()
export class DepositMapping extends AddressMapping {

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

  @Column({
    length: 255,
    nullable: true,
  })
  email: string;

  @OneToMany(type => Transaction, tx => tx.depositMapping, {
    lazy: true,
  })
  transactions: Transaction[];
}
