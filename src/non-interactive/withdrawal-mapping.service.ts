import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import {BadRequestException, Injectable} from '@nestjs/common';
import { WalletFactoryService } from '../wallets/wallet-factory.service';
import { WithdrawalMapping } from './withdrawal-mapping.entity';
import { ValidationError } from 'class-validator';
import { ConfigService, InjectConfig } from 'nestjs-config';
import {AssetInterface} from '../interfaces/asset.interface';

@Injectable()
export class WithdrawalMappingService {
  constructor(
    @InjectConfig()
    protected readonly config: ConfigService,
    @InjectRepository(WithdrawalMapping)
    protected readonly repo: Repository<WithdrawalMapping>,
    protected readonly walletFactory: WalletFactoryService,
  ) {
  }

  async getWithdrawalMapping(asset: AssetInterface, dest: string, destExtra: string) {
    if (!this.walletFactory.get(asset.code).isValidDestination(asset.code, dest, destExtra)) {
      throw new BadRequestException({
        statusCode: 400,
        error: 'Bad Request',
        message: [
          {
            property: 'dest',
            value: dest,
            constraints: {
              isValidDestination: 'Invalid destination',
            },
            children: [],
          } as ValidationError,
        ],
      });
    }
    let withdrawalMapping = await this.repo.findOne({
      addressOut: dest,
      addressOutExtra: destExtra,
      asset: asset.code,
    });
    if (!withdrawalMapping) {
      withdrawalMapping = this.repo.create({
        addressIn: asset.distributor,
        addressOut: dest,
        addressOutExtra: destExtra,
        asset: asset.code,
      });
      const { id } = await this.repo.save(withdrawalMapping);
      withdrawalMapping.id = id;
    }
    return withdrawalMapping;
  }
}
