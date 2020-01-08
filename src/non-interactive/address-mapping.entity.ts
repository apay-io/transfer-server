import {
  Entity,
  Column,
  CreateDateColumn,
  PrimaryGeneratedColumn, OneToMany, TableInheritance,
} from 'typeorm';
import { TrimStringTransformer } from '../transformers/trim-string.transformer';
import { Transaction } from '../transactions/transaction.entity';

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
