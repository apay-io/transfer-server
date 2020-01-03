import {
  Entity,
  Column,
  CreateDateColumn,
  PrimaryGeneratedColumn, Unique, ManyToOne, JoinColumn,

} from 'typeorm';
import { Transaction } from './transaction.entity';

@Entity()
@Unique(['txIn', 'txInIndex', 'state'])
export class TransactionLog {
  @PrimaryGeneratedColumn()
  id?: number;

  @Column({
    type: 'enum',
    enum: [
      'building',
      'signing',
      'submitting',
    ],
    default: 'building',
  })
  state: string;

  @Column({length: 255, nullable: false})
  txIn: string;

  @Column({nullable: true})
  txInIndex: number;

  @CreateDateColumn()
  createdAt?: Date;

  @Column({
    type: 'timestamp without time zone',
    nullable: true,
  })
  processedAt?: Date;

  @Column({ type: 'json', nullable: true })
  output?: object;

  @ManyToOne(type => Transaction, tx => tx.logs)
  @JoinColumn([
    {name: 'txIn', referencedColumnName: 'txIn'},
    {name: 'txInIndex', referencedColumnName: 'txInIndex'},
  ])
  transaction: Transaction;
}
