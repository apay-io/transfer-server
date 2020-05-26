import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule, ConfigService } from 'nestjs-config';
import * as path from 'path';
import { StellarService } from './stellar.service';
import { RedisService } from 'nestjs-redis';
import { Networks, Server } from 'stellar-sdk';

const account = 'GDKJKGQMA4C4G3GCR6CPSGRTQ5J2XSWG6XLNOFGXPUWMNBU6FRAMVWKG';
const secret = 'SDNB4NJ7RHJZWEDT265GN67Z4AVZCBGN33YB6G7JVELC7U4IPTCIOL4Q';

const userAccount = 'GCW24SG55GXKDIDVJMDBBW665HS7XZ4QRZFBSLMOR5BTBA3PG5YDHDGY';
const userSecret = 'SCGEGT7YDA4MY2XIVDHWCPOTX3WMKPODQUNHNY6V2WRDQHYKXSADGVQY';

describe('StellarService', () => {
  let driver: StellarService;
  let config: ConfigService;
  const fakeHorizon = {
    feeStats: () => Promise.resolve({
        fee_charged: {
          mode: 100,
        }
    }),
    loadAccount: () => Promise.resolve({
      balances: [
        { asset_type: 'native', balance: '100' },
        { asset_type: 'credit_alphanum4', asset_code: 'TBTC',
          asset_issuer: 'GAIJQAYGJ2TMP7OC5NFBJTPELBHZZJ4LDLTS4JZBV5SMVUKJGKTI4Q3O', balance: '0.5' }
      ],
      sequenceNumber: () => '123'
    }),
  };
  const configMock = {
    get: () => {
      return {
        skipFeeEstimation: false,
        networkPassphrase: Networks.TESTNET,
        getAssetConfig: () => {
          return {
            networkPassphrase: Networks.TESTNET,
            stellar: {
              issuer: 'GAIJQAYGJ2TMP7OC5NFBJTPELBHZZJ4LDLTS4JZBV5SMVUKJGKTI4Q3O',
            },
            totalSupply: 200
          };
        },
        horizonUrls: {
          'Test SDF Network ; September 2015': 'https://horizon-testnet.stellar.org',
        }
      }
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
      providers: [
        StellarService,
        { provide: RedisService, useValue: {}},
        { provide: ConfigService, useValue: configMock },
      ],
    }).compile();

    driver = app.get<StellarService>(StellarService);
    config = app.get<ConfigService>(ConfigService);
  });

  describe('stellar service', () => {
    it('should get server', async () => {
      const server = new Server('https://horizon-testnet.stellar.org');

      expect(await driver.getServerByAsset('TBTC')).toStrictEqual(server);
      expect(await driver.getServer(Networks.TESTNET)).toStrictEqual(server);
    });

    it('should estimate fees', async () => {
      const spy = spyOn(driver, 'getServer').and.returnValue(fakeHorizon);
      expect(await driver.getModerateFee(Networks.PUBLIC)).toStrictEqual('100');
      expect(spy.calls.count()).toEqual(1);
    });

    it('should estimate fees', async () => {
      spyOn(configMock, 'get').and.returnValue({ skipFeeEstimation: true });
      const spy = spyOn(driver, 'getServer').and.returnValue(fakeHorizon);
      expect(await driver.getModerateFee(Networks.PUBLIC)).toStrictEqual('100');
      expect(spy.calls.count()).toEqual(0);
    });

    it('should get sequence correctly', async () => {
      spyOn(driver, 'getServer').and.returnValue(fakeHorizon);
      expect(await driver.getSequence('TBTC', account)).toStrictEqual('123');
    });

    it('should get balance correctly', async () => {
      spyOn(driver, 'getServer').and.returnValue(fakeHorizon);
      expect((await driver.getBalance('TBTC')).toString()).toStrictEqual('199.5');
    });

  });
});
