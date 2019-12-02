import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Injectable } from '@nestjs/common';
import { DepositMapping } from './deposit-mapping.entity';
import { MemoType } from 'stellar-sdk';
import { WalletFactoryService } from '../wallets/wallet-factory.service';

@Injectable()
export class DepositMappingService {
  constructor(
    @InjectRepository(DepositMapping)
    protected readonly repo: Repository<DepositMapping>,
    protected readonly walletFactory: WalletFactoryService,
  ) {
  }

  async getDepositAddress(
    asset: string,
    addressOut: string,
    addressOutExtraType: MemoType,
    addressOutExtra: string,
    email: string,
  ) {
    let mapping = await this.repo.findOne({
      asset, addressOut, addressOutExtraType, addressOutExtra, email,
    });
    if (!mapping) {
      const { addressIn, addressInExtra } = await this.walletFactory.get(asset).getNewAddress(asset);
      mapping = this.repo.create({
        asset, addressIn, addressInExtra, addressOut, addressOutExtra, addressOutExtraType, email,
      });
      console.log(mapping);
      await this.repo.save(mapping);
    }
    return DepositMappingService.getDepositAddressString(asset, mapping.addressIn, mapping.addressInExtra);
  }

  private static getDepositAddressString(asset: string, addressIn: string, addressInExtra: string) {
    switch (asset) {
      case 'KIN':
        return `memo: ${addressInExtra} address: ${addressIn}`;
      case 'XRP':
        return `tag: ${addressInExtra} address: ${addressIn}`;
      default:
        return addressIn;
    }
  }
}
