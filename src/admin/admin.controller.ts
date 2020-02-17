import { Controller, Get, Render } from '@nestjs/common';
import { TransactionsService } from '../transactions/transactions.service';

@Controller('admin')
export class AdminController {

  constructor(
    private readonly txsService: TransactionsService,
  ) {
  }

  @Get()
  @Render('admin/index')
  root() {
    return { message: 'Hello world!' };
  }

  @Get('/txs')
  @Render('admin/txs')
  async txs() {
    const txs = await this.txsService.find({
      limit: 100,
    });
    return {
      txs,
    };
  }
}
