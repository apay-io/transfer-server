import {
  Entity,
  Column,
  CreateDateColumn,
  PrimaryGeneratedColumn, Unique, ManyToOne, JoinColumn,

} from 'typeorm';
import { Transaction } from './transaction.entity';

@Entity()
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
  channel: string;

  @Column({
    length: 255,
    nullable: true,
  })
  sequence?: string;

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
    {name: 'channel', referencedColumnName: 'channel'},
    {name: 'sequence', referencedColumnName: 'sequence'},
  ])
  transaction?: Transaction;
}
