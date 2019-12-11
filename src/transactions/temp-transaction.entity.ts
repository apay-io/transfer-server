import {
  Entity,
  Column,
  CreateDateColumn,
  Generated,
  PrimaryGeneratedColumn,

} from 'typeorm';

@Entity()
export class TempTransaction {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({type: 'uuid', nullable: false})
  @Generated('uuid')
  uuid: string;

  @Column({length: 255, nullable: false})
  hash: string;

  @Column({length: 255, nullable: false})
  chain: string;

  @CreateDateColumn()
  createdAt: Date;
}
