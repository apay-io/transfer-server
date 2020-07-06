import { Body, Controller, Post, Req, UseGuards, UseInterceptors } from '@nestjs/common';
import { AnyFilesInterceptor } from '@nestjs/platform-express';
import { WithdrawDto } from '../non-interactive/dto/withdraw.dto';
import { DepositDto } from '../non-interactive/dto/deposit.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { TempTransactionsService } from '../transactions/temp-transactions.service';
import { createHash } from 'crypto';
import { TransactionType } from '../transactions/enums/transaction-type.enum';
import { ConfigService } from '@nestjs/config';

type InteractiveResponseType = 'interactive_customer_info_needed';

interface InteractiveResponse {
  id: string;
  type: InteractiveResponseType;
  url: string;
}

@Controller()
@UseGuards(JwtAuthGuard)
export class InteractiveController {

  constructor(
    private readonly config: ConfigService,
    private readonly tempTxService: TempTransactionsService,
  ) {
  }

  @Post('transactions/deposit/interactive')
  @UseInterceptors(AnyFilesInterceptor())
  async deposit(@Req() req, @Body() depositDto: DepositDto): Promise<InteractiveResponse> {
    const tempTx = await this.tempTxService.save({
      type: TransactionType.deposit,
      asset: depositDto.asset_code,
      hash: createHash('sha256').update(req.user.sub + Date.now().toString()).digest('hex')
    });

    return {
      id: tempTx.uuid,
      type: 'interactive_customer_info_needed',
      url: this.config.get<string>('app.frontUrl') + `/deposit/${tempTx.uuid}`,
    }
  }

  @Post('transactions/withdraw/interactive')
  @UseInterceptors(AnyFilesInterceptor())
  async withdraw(@Req() req, @Body() withdrawDto: WithdrawDto): Promise<InteractiveResponse> {
    const tempTx = await this.tempTxService.save({
      type: TransactionType.withdrawal,
      asset: withdrawDto.asset_code,
      hash: createHash('sha256').update(req.user.sub + Date.now().toString()).digest('hex')
    });
    return {
      id: tempTx.uuid,
      type: 'interactive_customer_info_needed',
      url: this.config.get<string>('app.frontUrl') + `/withdraw/${tempTx.uuid}`,
    };
  }
}
