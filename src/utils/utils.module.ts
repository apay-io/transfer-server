import { HttpModule, Module } from '@nestjs/common';
import { UtilsService } from './utils.service';

@Module({
  exports: [UtilsService],
  imports: [HttpModule],
  providers: [UtilsService],
})
export class UtilsModule {}
