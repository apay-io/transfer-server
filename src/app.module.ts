import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from 'nestjs-config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TransactionsModule } from './transactions/transactions.module';
import { NonInteractiveModule } from './non-interactive/non-interactive.module';
import { WalletsModule } from './wallets/wallets.module';
import * as path from 'path';
import { QueuesModule } from './queues/queues.module';
import { UtilsModule } from './utils/utils.module';
import { RedisModule } from 'nestjs-redis';

@Module({
  imports: [
    ConfigModule.load(
      path.resolve(__dirname, 'config/**/!(*.d).{ts,js}'),
      {path: process.cwd() + '/' + (process.env.NODE_ENV || '') + '.env'},
    ),
    TypeOrmModule.forRootAsync({
      useFactory: (config: ConfigService) => config.get('database'),
      inject: [ConfigService],
    }),
    RedisModule.forRootAsync({
      useFactory: (configService: ConfigService) => configService.get('redis'),
      inject: [ConfigService],
    }),
    TransactionsModule,
    NonInteractiveModule,
    WalletsModule,
    QueuesModule,
    UtilsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {
}
