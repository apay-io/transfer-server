import {
  Entity,
  Column,
  CreateDateColumn,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { TrimStringTransformer } from '../transformers/trim-string.transformer';

@Entity()
export class WithdrawalMapping {
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
    transformer: new TrimStringTransformer(),
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
}
