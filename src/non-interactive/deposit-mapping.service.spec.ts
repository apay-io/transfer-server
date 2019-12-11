import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from 'nestjs-config';
import { DepositMappingService } from './deposit-mapping.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DepositMapping } from './deposit-mapping.entity';
import { Repository } from 'typeorm';
import { WalletFactoryService } from '../wallets/wallet-factory.service';
import { BitgoDriver } from '../wallets/drivers/bitgo.driver';

const RepositoryMock = jest.fn(() => ({
  create: (mapping) => mapping as DepositMapping,
  save: () => null,
  findOne: () => null,
}));
const BitgoDriverMock = jest.fn(() => ({
  getNewAddress: () => '',
}));
const ConfigServiceMock = jest.fn(() => ({
  get: (key) => {
    const config = {
      assets: [
        {
          code: 'TBTC',
          stellar: {
            issuer: 'GAIJQAYGJ2TMP7OC5NFBJTPELBHZZJ4LDLTS4JZBV5SMVUKJGKTI4Q3O',
            name: '',
            desc: '',
            image: '',
            status: 'live',
          },
          distributor: 'GAJ4SKSKRWFZVCB5OROZLSWOUC4OEI4QKHV46FDLR3D372KAU3TQEI2X',
          channels: [
            'GAGQNTK7BR2UBP4Q6PER4ODTMFKO3IURMFRTSEKYEGNCA4QNGEUGKF3K',
          ],
          deposit: {
            eta: 1200,
            min: 0.0002,
            fee_create: 0.0001,
            fee_fixed: 0.0001,
            fee_percent: 0.001,
          },
        },
      ],
      stellar: {
        fundingAmount: 8,
      },
    };
    return config[key];
  }}));

describe('DepositMappingService', () => {
  let depositMappingService: DepositMappingService;
  let bitgoDriver: BitgoDriver;
  let repo: Repository<DepositMapping>;
  const WalletFactoryServiceMock = jest.fn(() => ({
    get: () => bitgoDriver,
  }));

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      providers: [
        DepositMappingService,
        { provide: ConfigService, useClass: ConfigServiceMock },
        { provide: WalletFactoryService, useClass: WalletFactoryServiceMock },
        { provide: BitgoDriver, useClass: BitgoDriverMock },
        { provide: getRepositoryToken(DepositMapping), useClass: RepositoryMock },
      ],
    }).compile();

    depositMappingService = app.get<DepositMappingService>(DepositMappingService);
    bitgoDriver = app.get<BitgoDriver>(BitgoDriver);
    repo = app.get<Repository<DepositMapping>>(getRepositoryToken(DepositMapping));
  });

  describe('DepositMappingService', () => {
    it('return valid response for existing mapping', async () => {
      const spy = spyOn(bitgoDriver, 'getNewAddress').and.returnValue(null);
      const spy2 = spyOn(repo, 'findOne').and.returnValue({
        addressIn: 'tb1qtpdvsyqxr8ky3n33gnme048q6jcnsusym7q2kkhmzw5xs3kv9p6suanya5',
        id: 1,
      });

      expect(await depositMappingService.getDepositAddress(
        'TBTC',
        'GAY5RGI5K3EAZFKV4JRDKU4I3HADEGIVWNYIS34DMUMCKZGG4HFWXZXV',
        null,
        null,
        null,
      )).toEqual('tb1qtpdvsyqxr8ky3n33gnme048q6jcnsusym7q2kkhmzw5xs3kv9p6suanya5');
    });

    it('return valid response if mapping doesnt exist', async () => {
      const spy = spyOn(bitgoDriver, 'getNewAddress').and.returnValue(
        Promise.resolve('tb1qtpdvsyqxr8ky3n33gnme048q6jcnsusym7q2kkhmzw5xs3kv9p6suanya5',
      ));
      const spy2 = spyOn(repo, 'findOne').and.returnValue(null);
      const spy3 = spyOn(repo, 'save').and.returnValue({ id: 1 });

      expect(await depositMappingService.getDepositAddress(
        'TBTC',
        'GAY5RGI5K3EAZFKV4JRDKU4I3HADEGIVWNYIS34DMUMCKZGG4HFWXZXV',
        null,
        null,
        null,
      )).toEqual('tb1qtpdvsyqxr8ky3n33gnme048q6jcnsusym7q2kkhmzw5xs3kv9p6suanya5');
      expect(spy2.calls.count()).toBe(1);
      expect(spy3.calls.count()).toBe(1);
      expect(spy3.calls.argsFor(0)).toStrictEqual([{
        asset: 'TBTC',
        addressIn: 'tb1qtpdvsyqxr8ky3n33gnme048q6jcnsusym7q2kkhmzw5xs3kv9p6suanya5',
        addressOut: 'GAY5RGI5K3EAZFKV4JRDKU4I3HADEGIVWNYIS34DMUMCKZGG4HFWXZXV',
        addressOutExtra: null,
        addressOutExtraType: null,
        email: null,
        id: 1,
      }]);
    });

  });
});
