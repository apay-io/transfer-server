import { Module } from '@nestjs/common';
import { BullModule, BullModuleOptions } from '@nestjs/bull';
import { ConfigModule, ConfigService } from '@nestjs/config';

const bullModuleFactory = (config: ConfigService): BullModuleOptions => {
  return {
    redis: config.get<string>('redis.url'),
  };
};

const BullQueueModule = BullModule.registerQueueAsync(
  {
    name: 'temp-transactions',
    imports: [ConfigModule],
    useFactory: bullModuleFactory,
    inject: [ConfigService],
  },
  {
    name: 'transactions',
    imports: [ConfigModule],
    useFactory: bullModuleFactory,
    inject: [ConfigService],
  },
  {
    name: 'sign',
    imports: [ConfigModule],
    useFactory: bullModuleFactory,
    inject: [ConfigService],
  },
  {
    name: 'submit',
    imports: [ConfigModule],
    useFactory: bullModuleFactory,
    inject: [ConfigService],
  },
);

@Module({
  imports: [
    BullQueueModule,
  ],
  exports: [
    BullQueueModule,
  ],
  providers: [
  ],
})
export class QueuesModule {}
