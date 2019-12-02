import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from 'nestjs-config';
import { NonInteractiveController } from './non-interactive.controller';
import { DepositMappingService } from './deposit-mapping.service';
import { StellarService } from './stellar.service';
import { DepositDto } from './dto/deposit.dto';

const mockService = jest.fn(() => ({
  getDepositAddress: () => '',
}));
const StellarServiceMock = jest.fn(() => ({
  checkAccount: () => '',
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

describe('NonInteractiveController', () => {
  let controller: NonInteractiveController;
  let depositMappingService: DepositMappingService;
  let stellarService: StellarService;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [NonInteractiveController],
      providers: [
        { provide: ConfigService, useClass: ConfigServiceMock },
        { provide: DepositMappingService, useClass: mockService },
        { provide: StellarService, useClass: StellarServiceMock },
      ],
    }).compile();

    controller = app.get<NonInteractiveController>(NonInteractiveController);
    depositMappingService = app.get<DepositMappingService>(DepositMappingService);
    stellarService = app.get<StellarService>(StellarService);
  });

  describe('/transactions/deposit/non-interactive', () => {
    it('return valid response without extra if account exists and trusts', async () => {
      const spy = spyOn(depositMappingService, 'getDepositAddress').and.returnValue('tb1qtpdvsyqxr8ky3n33gnme048q6jcnsusym7q2kkhmzw5xs3kv9p6suanya5');
      const spy2 = spyOn(stellarService, 'checkAccount').and.returnValue({ trusts: true, exists: true });

      expect(await controller.deposit({
        asset_code: 'TBTC',
        account: 'GAY5RGI5K3EAZFKV4JRDKU4I3HADEGIVWNYIS34DMUMCKZGG4HFWXZXV',
      } as DepositDto)).toStrictEqual({
        how: 'tb1qtpdvsyqxr8ky3n33gnme048q6jcnsusym7q2kkhmzw5xs3kv9p6suanya5',
        eta: 1200,
        fee_fixed: 0.0001,
        fee_percent: 0.001,
        min_amount: 0.0002,
        max_amount: undefined,
      });
    });

    it('return valid response with extra if account doesnt trust', async () => {
      const spy = spyOn(depositMappingService, 'getDepositAddress').and.returnValue('tb1qtpdvsyqxr8ky3n33gnme048q6jcnsusym7q2kkhmzw5xs3kv9p6suanya5');
      const spy2 = spyOn(stellarService, 'checkAccount').and.returnValue({ trusts: false, exists: true });

      expect(await controller.deposit({
        asset_code: 'TBTC',
        account: 'GAY5RGI5K3EAZFKV4JRDKU4I3HADEGIVWNYIS34DMUMCKZGG4HFWXZXV',
      } as DepositDto)).toStrictEqual({
        how: 'tb1qtpdvsyqxr8ky3n33gnme048q6jcnsusym7q2kkhmzw5xs3kv9p6suanya5',
        eta: 1200,
        fee_fixed: 0.0001,
        fee_percent: 0.001,
        min_amount: 0.0002,
        max_amount: undefined,
        extra_info: {
          message: `You need to establish a trustline for asset TBTC to account GAIJQAYGJ2TMP7OC5NFBJTPELBHZZJ4LDLTS4JZBV5SMVUKJGKTI4Q3O`,
        },
      });
    });

    it('return valid response with increased fixed fee and extra if account doesnt exist', async () => {
      const spy = spyOn(depositMappingService, 'getDepositAddress').and.returnValue('tb1qtpdvsyqxr8ky3n33gnme048q6jcnsusym7q2kkhmzw5xs3kv9p6suanya5');
      const spy2 = spyOn(stellarService, 'checkAccount').and.returnValue({ trusts: false, exists: false });

      expect(await controller.deposit({
        asset_code: 'TBTC',
        account: 'GAY5RGI5K3EAZFKV4JRDKU4I3HADEGIVWNYIS34DMUMCKZGG4HFWXZXV',
      } as DepositDto)).toStrictEqual({
        how: 'tb1qtpdvsyqxr8ky3n33gnme048q6jcnsusym7q2kkhmzw5xs3kv9p6suanya5',
        eta: 1200,
        fee_fixed: 0.0002,
        fee_percent: 0.001,
        min_amount: 0.0002,
        max_amount: undefined,
        extra_info: {
          message: 'Account will be funded with 8 XLM. You need to establish a trustline for asset TBTC to account GAIJQAYGJ2TMP7OC5NFBJTPELBHZZJ4LDLTS4JZBV5SMVUKJGKTI4Q3O',
        },
      });
    });

  });
});
