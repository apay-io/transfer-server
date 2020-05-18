import { Module } from '@nestjs/common';
import { BullModule, BullModuleOptions } from '@nestjs/bull';
import { ConfigModule, ConfigService } from 'nestjs-config';

const BullQueueModule = BullModule.registerQueueAsync(
  {
    name: 'temp-transactions',
    imports: [ConfigModule],
    useFactory: (config: ConfigService): BullModuleOptions => {
      return {
        redis: config.get('redis'),
      };
    },
    inject: [ConfigService],
  },
  {
    name: 'transactions',
    imports: [ConfigModule],
    useFactory: (config: ConfigService): BullModuleOptions => {
      return {
        redis: config.get('redis'),
      };
    },
    inject: [ConfigService],
  },
  {
    name: 'sign',
    imports: [ConfigModule],
    useFactory: (config: ConfigService): BullModuleOptions => {
      return {
        redis: config.get('redis'),
      };
    },
    inject: [ConfigService],
  },
  {
    name: 'submit',
    imports: [ConfigModule],
    useFactory: (config: ConfigService): BullModuleOptions => {
      return {
        redis: config.get('redis'),
      };
    },
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
