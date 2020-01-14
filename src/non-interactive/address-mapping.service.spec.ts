import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from 'nestjs-config';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DepositMapping } from './address-mapping.entity';
import { Repository } from 'typeorm';
import { WalletFactoryService } from '../wallets/wallet-factory.service';
import { BitgoDriver } from '../wallets/drivers/bitgo.driver';
import { AddressMappingService } from './address-mapping.service';
import { AddressMapping } from './address-mapping.entity';
import { StellarService } from '../wallets/stellar.service';

const RepositoryMock = jest.fn(() => ({
  create: (mapping) => mapping,
  save: () => null,
  findOne: () => null,
}));
const BitgoDriverMock = jest.fn(() => ({
  getNewAddress: () => '',
  isValidDestination: () => true,
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

describe('AddressMappingService', () => {
  let addressMappingService: AddressMappingService;
  let bitgoDriver: BitgoDriver;
  let stellarService: StellarService;
  let repo: Repository<AddressMapping>;
  let depositRepo: Repository<DepositMapping>;
  const WalletFactoryServiceMock = jest.fn(() => ({
    get: () => bitgoDriver,
  }));
  let walletFactory;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      providers: [
        AddressMappingService,
        { provide: ConfigService, useClass: ConfigServiceMock },
        { provide: WalletFactoryService, useClass: WalletFactoryServiceMock },
        { provide: BitgoDriver, useClass: BitgoDriverMock },
        { provide: StellarService, useClass: BitgoDriverMock },
        { provide: getRepositoryToken(AddressMapping), useClass: RepositoryMock },
        { provide: getRepositoryToken(DepositMapping), useClass: RepositoryMock },
      ],
    }).compile();

    addressMappingService = app.get<AddressMappingService>(AddressMappingService);
    walletFactory = app.get<WalletFactoryService>(WalletFactoryService);
    bitgoDriver = app.get<BitgoDriver>(BitgoDriver);
    repo = app.get<Repository<AddressMapping>>(getRepositoryToken(AddressMapping));
    depositRepo = app.get<Repository<DepositMapping>>(getRepositoryToken(DepositMapping));
    stellarService = app.get<StellarService>(StellarService);
  });

  describe('addressMappingService', () => {
    it('return valid response for existing deposit mapping', async () => {
      const spy = spyOn(bitgoDriver, 'getNewAddress').and.returnValue(null);
      const spy2 = spyOn(depositRepo, 'findOne').and.returnValue({
        addressIn: 'tb1qtpdvsyqxr8ky3n33gnme048q6jcnsusym7q2kkhmzw5xs3kv9p6suanya5',
        addressOut: 'GAY5RGI5K3EAZFKV4JRDKU4I3HADEGIVWNYIS34DMUMCKZGG4HFWXZXV',
        asset: 'TBTC',
        id: 1,
      });

      expect(await addressMappingService.getAddressMapping(
        walletFactory.get('TBTC'),
        stellarService,
        {
          asset: 'TBTC',
          addressOut: 'GAY5RGI5K3EAZFKV4JRDKU4I3HADEGIVWNYIS34DMUMCKZGG4HFWXZXV',
        },
        depositRepo,
      )).toStrictEqual({
        addressIn: 'tb1qtpdvsyqxr8ky3n33gnme048q6jcnsusym7q2kkhmzw5xs3kv9p6suanya5',
        addressOut: 'GAY5RGI5K3EAZFKV4JRDKU4I3HADEGIVWNYIS34DMUMCKZGG4HFWXZXV',
        asset: 'TBTC',
        id: 1,
      });
    });

    it('return valid response if deposit mapping doesnt exist', async () => {
      const spy = spyOn(bitgoDriver, 'getNewAddress').and.returnValue(
        Promise.resolve('tb1qtpdvsyqxr8ky3n33gnme048q6jcnsusym7q2kkhmzw5xs3kv9p6suanya5',
      ));
      const spy2 = spyOn(depositRepo, 'findOne').and.returnValue(null);
      const spy3 = spyOn(depositRepo, 'save').and.returnValue({ id: 1 });

      expect(await addressMappingService.getAddressMapping(
        walletFactory.get('TBTC'),
        stellarService,
        {
          asset: 'TBTC',
          addressOut: 'GAY5RGI5K3EAZFKV4JRDKU4I3HADEGIVWNYIS34DMUMCKZGG4HFWXZXV',
          addressOutExtra: null,
          addressOutExtraType: null,
          email: null,
        },
        depositRepo,
      )).toStrictEqual({
        addressIn: 'tb1qtpdvsyqxr8ky3n33gnme048q6jcnsusym7q2kkhmzw5xs3kv9p6suanya5',
        addressOut: 'GAY5RGI5K3EAZFKV4JRDKU4I3HADEGIVWNYIS34DMUMCKZGG4HFWXZXV',
        addressOutExtra: null,
        addressOutExtraType: null,
        email: null,
        asset: 'TBTC',
        id: 1,
      });
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

    it('return valid response for existing withdrawal mapping', async () => {
      const spy = spyOn(bitgoDriver, 'isValidDestination').and.returnValue(true);
      const spy2 = spyOn(repo, 'findOne').and.returnValue({
        addressIn: 'GAJ4SKSKRWFZVCB5OROZLSWOUC4OEI4QKHV46FDLR3D372KAU3TQEI2X',
        addressOut: 'tb1qtpdvsyqxr8ky3n33gnme048q6jcnsusym7q2kkhmzw5xs3kv9p6suanya5',
        addressOutExtra: null,
        asset: 'TBTC',
        id: 1,
      });

      expect(await addressMappingService.getAddressMapping(
        stellarService,
        walletFactory.get('TBTC'),
        {
          asset: 'TBTC',
          addressOut: 'tb1qtpdvsyqxr8ky3n33gnme048q6jcnsusym7q2kkhmzw5xs3kv9p6suanya5',
          addressOutExtra: null,
        },
        repo,
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

    it('return valid response if withdrawal mapping doesnt exist', async () => {
      const spy = spyOn(bitgoDriver, 'isValidDestination').and.returnValue(true);
      spyOn(stellarService, 'getNewAddress').and.returnValue('GAJ4SKSKRWFZVCB5OROZLSWOUC4OEI4QKHV46FDLR3D372KAU3TQEI2X');
      const spy2 = spyOn(repo, 'findOne').and.returnValue(null);
      const spy3 = spyOn(repo, 'save').and.returnValue({ id: 1 });

      expect(await addressMappingService.getAddressMapping(
        stellarService,
        walletFactory.get('TBTC'),
        {
          asset: 'TBTC',
          addressOut: 'tb1qtpdvsyqxr8ky3n33gnme048q6jcnsusym7q2kkhmzw5xs3kv9p6suanya5',
          addressOutExtra: null,
        },
        repo,
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

      await expect(addressMappingService.getAddressMapping(
        stellarService,
        walletFactory.get('TBTC'),
        {
          asset: 'TBTC',
          addressOut: 'asd',
          addressOutExtra: null,
        },
        repo,
      )).rejects.toThrow();
    });

  });
});
