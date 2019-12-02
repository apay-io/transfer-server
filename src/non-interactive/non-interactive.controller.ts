import { Body, Controller, Post, UploadedFiles, UseInterceptors } from '@nestjs/common';
import { ConfigService, InjectConfig } from 'nestjs-config';
import { DepositDto } from './dto/deposit.dto';
import { DepositResponseDto } from './dto/deposit-response.dto';
import { AssetInterface } from '../interfaces/asset.interface';
import { StellarService } from './stellar.service';
import { DepositMappingService } from './deposit-mapping.service';
import { AnyFilesInterceptor } from '@nestjs/platform-express';

@Controller()
export class NonInteractiveController {
  constructor(
    @InjectConfig()
    private readonly config: ConfigService,
    private readonly stellarService: StellarService,
    private readonly depositMappingService: DepositMappingService,
  ) {
  }

  @Post('transactions/deposit/non-interactive')
  @UseInterceptors(AnyFilesInterceptor())
  async deposit(
    @Body() depositDto: DepositDto,
  ): Promise<DepositResponseDto> {
    const asset: AssetInterface = this.config.get('assets').find((item) => item.code === depositDto.asset_code);
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
}
