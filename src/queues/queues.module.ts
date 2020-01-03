import { Module } from '@nestjs/common';
import { BullModule, BullModuleOptions } from 'nest-bull';
import { ConfigModule, ConfigService } from 'nestjs-config';

function redisOptions(configService: ConfigService) {
  return {
    host: configService.get('REDIS_HOST') || 'localhost',
    port: configService.get('REDIS_PORT') || 6379,
  };
}

const BullQueueModule = BullModule.registerAsync([
  {
    name: 'temp-transactions',
    imports: [ConfigModule],
    useFactory: (configService: ConfigService): BullModuleOptions => {
      return {
        name: 'temp-transactions',
        options: {
          redis: redisOptions(configService),
        },
      };
    },
    inject: [ConfigService],
  },
  {
    name: 'transactions',
    imports: [ConfigModule],
    useFactory: (configService: ConfigService): BullModuleOptions => {
      return {
        name: 'transactions',
        options: {
          redis: redisOptions(configService),
        },
      };
    },
    inject: [ConfigService],
  },
  {
    name: 'sign',
    imports: [ConfigModule],
    useFactory: (configService: ConfigService): BullModuleOptions => {
      return {
        name: 'sign',
        options: {
          redis: redisOptions(configService),
        },
      };
    },
    inject: [ConfigService],
  },
  {
    name: 'submit',
    imports: [ConfigModule],
    useFactory: (configService: ConfigService): BullModuleOptions => {
      return {
        name: 'submit',
        options: {
          redis: redisOptions(configService),
        },
      };
    },
    inject: [ConfigService],
  },
]);

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
