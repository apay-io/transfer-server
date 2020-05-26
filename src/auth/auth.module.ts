import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from './jwt.strategy';
import { AuthController } from './auth.controller';
import { WalletsModule } from '../wallets/wallets.module';
import { ConfigService } from 'nestjs-config';

@Module({
  controllers: [AuthController],
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      useFactory: (configService: ConfigService) => {
        return {
          secret: process.env.JWT_SECRET,
          signOptions: {
            expiresIn: '20m',
            appName: configService.get('app').appName,
          },
        };
      },
      inject: [ConfigService],
    }),
    WalletsModule,
  ],
  providers: [JwtStrategy],
  exports: [],
})
export class AuthModule {}
