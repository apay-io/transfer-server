import { Controller, Get, Param, Post, Render, Res } from '@nestjs/common';
import { TransactionsService } from '../transactions/transactions.service';
import { Response } from 'express';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { ConfigService, InjectConfig } from 'nestjs-config';

@Controller('admin')
export class AdminController {

  constructor(
    @InjectConfig()
    private readonly config: ConfigService,
    private readonly txsService: TransactionsService,
    @InjectQueue('transactions') readonly txsQueue: Queue,
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

  @Post('/txs/retry/:id')
  async retry(@Param('id') id, @Res() res: Response) {
    const tx = await this.txsService.findOne(id);
    await this.txsQueue.add({ txs: [tx] }, {
      ...this.config.get('queue').defaultJobOptions(),
    });
    return res.redirect(301, '/admin/txs');
  }
}
