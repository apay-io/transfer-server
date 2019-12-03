import { Module } from '@nestjs/common';
import { NonInteractiveController } from './non-interactive.controller';
import { StellarService } from './stellar.service';
import { WalletsModule } from '../wallets/wallets.module';
import { DepositMappingService } from './deposit-mapping.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DepositMapping } from './deposit-mapping.entity';

@Module({
  controllers: [
    NonInteractiveController,
  ],
  imports: [
    TypeOrmModule.forFeature([DepositMapping]),
    WalletsModule,
  ],
  providers: [
    DepositMappingService,
    StellarService,
  ],
})
export class NonInteractiveModule {}
