import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from 'nestjs-config';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WalletFactoryService } from '../wallets/wallet-factory.service';
import { BitgoDriver } from '../wallets/drivers/bitgo.driver';
import { WithdrawalMapping } from './withdrawal-mapping.entity';
import { WithdrawalMappingService } from './withdrawal-mapping.service';
import { BadRequestException } from '@nestjs/common';

const RepositoryMock = jest.fn(() => ({
  create: (mapping) => mapping as WithdrawalMapping,
  save: () => null,
  findOne: () => null,
}));
const BitgoDriverMock = jest.fn(() => ({
  isValidDestination: () => '',
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
          withdrawal: {
            eta: 1200,
            min: 0.0002,
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

describe('WithdrawalMappingService', () => {
  let configService: ConfigService;
  let withdrawalMappingService: WithdrawalMappingService;
  let bitgoDriver: BitgoDriver;
  let repo: Repository<WithdrawalMapping>;
  const WalletFactoryServiceMock = jest.fn(() => ({
    get: () => bitgoDriver,
  }));

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      providers: [
        WithdrawalMappingService,
        { provide: ConfigService, useClass: ConfigServiceMock },
        { provide: WalletFactoryService, useClass: WalletFactoryServiceMock },
        { provide: BitgoDriver, useClass: BitgoDriverMock },
        { provide: getRepositoryToken(WithdrawalMapping), useClass: RepositoryMock },
      ],
    }).compile();

    configService = app.get<ConfigService>(ConfigService);
    withdrawalMappingService = app.get<WithdrawalMappingService>(WithdrawalMappingService);
    bitgoDriver = app.get<BitgoDriver>(BitgoDriver);
    repo = app.get<Repository<WithdrawalMapping>>(getRepositoryToken(WithdrawalMapping));
  });

  describe('WithdrawalMappingService', () => {
    it('return valid response for existing mapping', async () => {
      const spy = spyOn(bitgoDriver, 'isValidDestination').and.returnValue(true);
      const spy2 = spyOn(repo, 'findOne').and.returnValue({
        addressIn: 'GAJ4SKSKRWFZVCB5OROZLSWOUC4OEI4QKHV46FDLR3D372KAU3TQEI2X',
        addressOut: 'tb1qtpdvsyqxr8ky3n33gnme048q6jcnsusym7q2kkhmzw5xs3kv9p6suanya5',
        addressOutExtra: null,
        asset: 'TBTC',
        id: 1,
      });

      expect(await withdrawalMappingService.getWithdrawalMapping(
        configService.get('assets')[0],
        'tb1qtpdvsyqxr8ky3n33gnme048q6jcnsusym7q2kkhmzw5xs3kv9p6suanya5',
        null,
      )).toStrictEqual({
        addressIn: 'GAJ4SKSKRWFZVCB5OROZLSWOUC4OEI4QKHV46FDLR3D372KAU3TQEI2X',
        addressOut: 'tb1qtpdvsyqxr8ky3n33gnme048q6jcnsusym7q2kkhmzw5xs3kv9p6suanya5',
        addressOutExtra: null,
        asset: 'TBTC',
        id: 1,
      });
      expect(spy.calls.count()).toBe(1);
      expect(spy2.calls.count()).toBe(1);
    });

    it('return valid response if mapping doesnt exist', async () => {
      const spy = spyOn(bitgoDriver, 'isValidDestination').and.returnValue(true);
      const spy2 = spyOn(repo, 'findOne').and.returnValue(null);
      const spy3 = spyOn(repo, 'save').and.returnValue({ id: 1 });

      expect(await withdrawalMappingService.getWithdrawalMapping(
        configService.get('assets')[0],
        'tb1qtpdvsyqxr8ky3n33gnme048q6jcnsusym7q2kkhmzw5xs3kv9p6suanya5',
        null,
      )).toStrictEqual({
        addressIn: 'GAJ4SKSKRWFZVCB5OROZLSWOUC4OEI4QKHV46FDLR3D372KAU3TQEI2X',
        addressOut: 'tb1qtpdvsyqxr8ky3n33gnme048q6jcnsusym7q2kkhmzw5xs3kv9p6suanya5',
        addressOutExtra: null,
        asset: 'TBTC',
        id: 1,
      });
      expect(spy2.calls.count()).toBe(1);
      expect(spy3.calls.count()).toBe(1);
      expect(spy3.calls.argsFor(0)).toStrictEqual([{
        asset: 'TBTC',
        addressIn: 'GAJ4SKSKRWFZVCB5OROZLSWOUC4OEI4QKHV46FDLR3D372KAU3TQEI2X',
        addressOut: 'tb1qtpdvsyqxr8ky3n33gnme048q6jcnsusym7q2kkhmzw5xs3kv9p6suanya5',
        addressOutExtra: null,
        id: 1,
      }]);
    });

    it('throw exception if destination is not valid', async () => {
      const spy = spyOn(bitgoDriver, 'isValidDestination').and.returnValue(false);

      await expect(withdrawalMappingService.getWithdrawalMapping(
        configService.get('assets')[0],
        'asd',
        null,
      )).rejects.toThrow();
    });

  });
});
