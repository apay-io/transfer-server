import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne
} from 'typeorm';
import { TrimStringTransformer } from '../transformers/trim-string.transformer';
import { User } from './user.entity';

@Entity()
export class Account {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true, transformer: new TrimStringTransformer() })
  account: string;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(type => User, user => user.accounts, {
    eager: true, persistence: true,
  })
  user: User;
}
