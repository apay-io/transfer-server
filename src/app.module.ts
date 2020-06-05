import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TransactionsModule } from './transactions/transactions.module';
import { NonInteractiveModule } from './non-interactive/non-interactive.module';
import { WalletsModule } from './wallets/wallets.module';
import { QueuesModule } from './queues/queues.module';
import { UtilsModule } from './utils/utils.module';
import { RedisModule } from 'nestjs-redis';
import { AdminModule } from './admin/admin.module';
import { AuthModule } from './auth/auth.module';
import { InteractiveModule } from './interactive/interactive.module';
import { KycModule } from './kyc/kyc.module';
import stellar from './config/stellar';
import redis from './config/redis';
import queue from './config/queue';
import database from './config/database';
import assets from './config/assets';
import app from './config/app';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: [process.cwd() + '/' + (process.env.NODE_ENV || '') + '.env'],
      load: [app, assets, database, queue, redis, stellar],
    }),
    TypeOrmModule.forRootAsync({
      useFactory: (config: ConfigService) => config.get('database'),
      inject: [ConfigService],
    }),
    RedisModule.forRootAsync({
      useFactory: (config: ConfigService) => config.get('redis'),
      inject: [ConfigService],
    }),
    TransactionsModule,
    NonInteractiveModule,
    WalletsModule,
    QueuesModule,
    UtilsModule,
    AdminModule,
    AuthModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {
}
