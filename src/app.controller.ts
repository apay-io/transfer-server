import { Body, Controller, Get, Header, Post, Req } from '@nestjs/common';
import { AppService } from './app.service';
import { ConfigService, InjectConfig } from 'nestjs-config';
import { AssetInterface } from './interfaces/asset.interface';
import { WalletFactoryService } from './wallets/wallet-factory.service';
import { TransactionType } from './transactions/enums/transaction-type.enum';

@Controller()
export class AppController {
  constructor(
    @InjectConfig()
    private readonly config: ConfigService,
    private readonly appService: AppService,
    private readonly walletFactory: WalletFactoryService,
  ) {
  }

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('.well-known/stellar.toml')
  @Header('Content-Type', 'text/plain')
  getStellarToml(@Req() req): string {
    let text = `TRANSFER_SERVER="${req.headers.host}"\n\n`;
    this.config.get('assets').raw.forEach((item: AssetInterface) => {
      text += `[[CURRENCIES]]\ncode="${item.code}"\n`;
      for (const [key, value] of Object.entries(item.stellar)) {
        text += `${key}=` + (typeof value === 'string' ? `"${value}"` : value) + `\n`;
      }
    });
    return text;
  }

  @Get('/info')
  info(@Req() req) {
    const response = {
      deposit: {},
      withdraw: {},
      fee: {
        enabled: false,
      },
      transactions: {
        enabled: true,
        authentication_required: false,
      },
      transaction: {
        enabled: true,
        authentication_required: false,
      },
    };

    const assets = this.config.get('assets').raw;
    for (const asset of assets) {
      response.deposit[asset.code] = {
        enabled: asset.stellar.status === 'live',
        ...(asset.deposit ? {
          fee_fixed: asset.deposit.fee_fixed,
          fee_percent: asset.deposit.fee_percent,
          min_amount: asset.deposit.min,
          max_amount: asset.deposit.max,
        } : {}),
      };
      response.withdraw[asset.code] = {
        enabled: asset.stellar.status === 'live',
        ...(asset.withdrawal ? {
          fee_fixed: asset.withdrawal.fee_fixed,
          fee_percent: asset.withdrawal.fee_percent,
          min_amount: asset.withdrawal.min,
          max_amount: asset.withdrawal.max,
          types: {
            crypto: {},
          },
        } : {}),
      };
    }

    return response;
  }

  @Post('/validateAddress')
  validateDestination(@Body() dto: { asset_code: string, dest: string, dest_extra: string }) {
    const { walletOut } = this.walletFactory.get(TransactionType.withdrawal, dto.asset_code);
    return walletOut.isValidDestination(dto.asset_code, dto.dest, dto.dest_extra);
  }
}
