import { Module } from '@nestjs/common';
import { BullModule, BullModuleOptions } from 'nest-bull';
import { ConfigModule, ConfigService } from 'nestjs-config';

const BullQueueModule = BullModule.registerAsync([
  {
    name: 'temp-transactions',
    imports: [ConfigModule],
    useFactory: (configService: ConfigService): BullModuleOptions => {
      return {
        name: 'temp-transactions',
        options: {
          redis: configService.get('redis'),
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
          redis: configService.get('redis'),
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
          redis: configService.get('redis'),
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
          redis: configService.get('redis'),
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
