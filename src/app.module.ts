import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from 'nestjs-config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import * as path from "path";

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
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
