import {
  Column, ChildEntity,
} from 'typeorm';
import { MemoType, MemoReturn, MemoHash, MemoText, MemoID } from 'stellar-sdk';
import { AddressMapping } from './address-mapping.entity';

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
}
