import { HttpModule, Module } from '@nestjs/common';
import { SumsubService } from './sumsub/sumsub.service';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule,
    HttpModule,
  ],
  providers: [SumsubService]
})
export class KycModule {}
