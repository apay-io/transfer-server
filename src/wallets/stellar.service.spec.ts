import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule, ConfigService } from 'nestjs-config';
import * as path from 'path';
import { StellarService } from './stellar.service';
import { RedisService } from 'nestjs-redis';


describe('StellarService', () => {
  let driver: StellarService;
  const fakeHorizon = {
    feeStats: () => {
      return {
        fee_charged: {
          mode: 100,
        }
      };
    }
  };

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.load(
          path.resolve(__dirname, 'config/**/!(*.d).{ts,js}'),
          {path: process.cwd() + '/' + (process.env.NODE_ENV || '') + '.env'},
        ),
      ],
      providers: [StellarService, { provide: RedisService, useValue: {}}],
    }).compile();

    driver = app.get<StellarService>(StellarService);
  });

  describe('stellar service', () => {
    it('should estimate fees', async () => {
      const spy = spyOn(driver, 'getServer').and.returnValue(fakeHorizon);
      expect(await driver.getModerateFee('TBTC')).toStrictEqual('100');
    });

  });
});
