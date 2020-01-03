import { Body, Controller, Post, UseInterceptors } from '@nestjs/common';
import { ConfigService, InjectConfig } from 'nestjs-config';
import { DepositDto } from './dto/deposit.dto';
import { DepositResponseDto } from './dto/deposit-response.dto';
import { AssetInterface } from '../interfaces/asset.interface';
import { StellarService } from './stellar.service';
import { DepositMappingService } from './deposit-mapping.service';
import { AnyFilesInterceptor } from '@nestjs/platform-express';
import { WithdrawDto } from './dto/withdraw.dto';
import { WithdrawalResponseDto } from './dto/withdrawal-response.dto';
import { MemoID } from 'stellar-sdk';
import { WithdrawalMappingService } from './withdrawal-mapping.service';

@Controller()
export class NonInteractiveController {
  constructor(
    @InjectConfig()
    private readonly config: ConfigService,
    private readonly stellarService: StellarService,
    private readonly depositMappingService: DepositMappingService,
    private readonly withdrawalMappingService: WithdrawalMappingService,
  ) {
  }

  @Post(['deposit', 'transactions/deposit/non-interactive'])
  @UseInterceptors(AnyFilesInterceptor())
  async deposit(
    @Body() depositDto: DepositDto,
  ): Promise<DepositResponseDto> {
    const asset = this.config.get('assets').getAssetConfig(depositDto.asset_code);
    const { exists, trusts } = await this.stellarService.checkAccount(
      depositDto.account,
      asset.code,
      asset.stellar.issuer,
    );
    const depositAddress = await this.depositMappingService.getDepositAddress(
      asset.code,
      depositDto.account,
      depositDto.memo_type,
      depositDto.memo,
      depositDto.email_address,
    );
    return {
      how: depositAddress,
      eta: asset.deposit.eta,
      min_amount: asset.deposit.min,
      max_amount: asset.deposit.max,
      fee_fixed: asset.deposit.fee_fixed + (exists ? 0 : asset.deposit.fee_create),
      fee_percent: asset.deposit.fee_percent,
      ...this.getExtraInfo(trusts, exists, asset),
    } as DepositResponseDto;
  }

  private getExtraInfo(trusts: boolean, exists: boolean, asset: AssetInterface) {
    return trusts && exists ? {} : {
      extra_info: {
        message: (exists ? `` : `Account will be funded with ${this.config.get('stellar').fundingAmount} XLM. `)
          + (trusts ? `` : `You need to establish a trustline for asset ${asset.code} to account ${asset.stellar.issuer}`),
      },
    };
  }

  @Post(['withdraw', 'transactions/withdraw/non-interactive'])
  @UseInterceptors(AnyFilesInterceptor())
  async withdraw(
      @Body() withdrawDto: WithdrawDto,
  ): Promise<WithdrawalResponseDto> {
    const asset = this.config.get('asset').getAssetConfig(withdrawDto.asset_code);
    const withdrawalMapping = await this.withdrawalMappingService.getWithdrawalMapping(
        asset,
        withdrawDto.dest,
        withdrawDto.dest_extra,
    );
    return {
      account_id: withdrawalMapping.addressIn,
      memo_type: MemoID,
      memo: withdrawalMapping.id.toString(),
      eta: asset.withdrawal.eta,
      min_amount: asset.withdrawal.min,
      max_amount: asset.withdrawal.max,
      fee_fixed: asset.withdrawal.fee_fixed,
      fee_percent: asset.withdrawal.fee_percent,
    } as WithdrawalResponseDto;
  }
}
