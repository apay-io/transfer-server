import { Module } from '@nestjs/common';
import { NonInteractiveController } from './non-interactive.controller';
import { WalletsModule } from '../wallets/wallets.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DepositMapping } from './address-mapping.entity';
import { AddressMappingService } from './address-mapping.service';
import { AddressMapping } from './address-mapping.entity';

@Module({
  controllers: [
    NonInteractiveController,
  ],
  exports: [
    AddressMappingService,
  ],
  imports: [
    TypeOrmModule.forFeature([AddressMapping, DepositMapping]),
    WalletsModule,
  ],
  providers: [
    AddressMappingService,
  ],
})
export class NonInteractiveModule {}
