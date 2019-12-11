import { Module } from '@nestjs/common';
import { NonInteractiveController } from './non-interactive.controller';
import { StellarService } from './stellar.service';
import { WalletsModule } from '../wallets/wallets.module';
import { DepositMappingService } from './deposit-mapping.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DepositMapping } from './deposit-mapping.entity';
import { WithdrawalMapping } from './withdrawal-mapping.entity';
import { WithdrawalMappingService } from './withdrawal-mapping.service';

@Module({
  controllers: [
    NonInteractiveController,
  ],
  imports: [
    TypeOrmModule.forFeature([DepositMapping, WithdrawalMapping]),
    WalletsModule,
  ],
  providers: [
    DepositMappingService,
    StellarService,
    WithdrawalMappingService,
  ],
})
export class NonInteractiveModule {}
