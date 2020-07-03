import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  OneToMany,
  Generated,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne
} from 'typeorm';
import { TrimStringTransformer } from '../transformers/trim-string.transformer';
import { DepositMapping } from '../non-interactive/address-mapping.entity';
import { Account } from './account.entity';

export enum UserRole {
  admin = 'admin',
  user = 'user',
}

@Entity()
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @Generated('increment')
  cursor: number;

  @Column({ length: 24, nullable: true })
  depositCode: string;

  @Column({
    type: 'simple-array',
    default: UserRole.user,
  })
  roles: string[];

  @Column({nullable: true})
  pendingExpiresAt: Date;

  @Column({default: false})
  isPending: boolean;

  @Column({default: false})
  isSuspended: boolean;

  @Column({default: false})
  kycPassed: boolean;

  @Column({ length: 100, transformer: new TrimStringTransformer() })
  firstName: string;

  @Column({ length: 100, transformer: new TrimStringTransformer() })
  lastName: string;

  @Column({ nullable: true, transformer: new TrimStringTransformer() })
  email: string;

  @Column({ length: 3, nullable: true, transformer: new TrimStringTransformer() })
  currency: string;

  @Column({nullable: true})
  lastIp: string;

  @Column({nullable: true})
  lastSeenAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(type => Account, account => account.user, {
    persistence: true,
  })
  accounts: Account[];
}
