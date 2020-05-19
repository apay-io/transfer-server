import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { BadRequestException, Injectable } from '@nestjs/common';
import { AddressMapping, DepositMapping } from './address-mapping.entity';
import { Wallet } from '../wallets/wallet.interface';
import { MappingDto } from './dto/mapping.dto';
import { ValidationError } from 'class-validator';

@Injectable()
export class AddressMappingService {
  constructor(
    @InjectRepository(DepositMapping)
    protected readonly depositRepo: Repository<DepositMapping>,
    @InjectRepository(AddressMapping)
    protected readonly addressRepo: Repository<AddressMapping>,
  ) {
  }

  async getAddressMapping(
    walletIn: Wallet,
    walletOut: Wallet,
    dto: MappingDto,
    repo: Repository<AddressMapping>,
  ): Promise<AddressMapping> {
    if (!(await walletOut.isValidDestination(dto.asset, dto.addressOut, dto.addressOutExtra))) {
      throw new BadRequestException({
        statusCode: 400,
        error: 'Bad Request',
        message: [
          {
            property: 'dest',
            value: dto.addressOut,
            constraints: {
              isValidDestination: 'Invalid destination',
            },
            children: [],
          } as ValidationError,
        ],
      });
    }
    let mapping = await repo.findOne(dto);
    if (!mapping) {
      mapping = repo.create({
        ...dto,
      });
      const { id } = await repo.save(mapping);
      mapping.id = id;
      mapping.addressIn = await walletIn.getNewAddress(dto.asset, id);
      await repo.save(mapping);
    }
    return mapping;
  }

  find(
    asset: string,
    addressIn: string,
    addressInExtra?: number,
  ): Promise<AddressMapping> {
    return addressInExtra
      ? this.addressRepo.findOne({ asset, id: addressInExtra })
      : this.addressRepo.findOne({ asset, addressIn });
  }
}
