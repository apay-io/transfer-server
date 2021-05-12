import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { StellarService } from '../wallets/stellar.service';
import { RedisService } from 'nestjs-redis';
import { JwtModule } from '@nestjs/jwt';
import { Networks, Transaction, Keypair, NotFoundError } from 'stellar-sdk';
import { ConfigModule, ConfigService } from '@nestjs/config';
import app from '../config/app';
global.Date.now = jest.fn(() => 1530518207007);

const account = 'GDKJKGQMA4C4G3GCR6CPSGRTQ5J2XSWG6XLNOFGXPUWMNBU6FRAMVWKG';
const secret = 'SDNB4NJ7RHJZWEDT265GN67Z4AVZCBGN33YB6G7JVELC7U4IPTCIOL4Q';

const userAccount = 'GCW24SG55GXKDIDVJMDBBW665HS7XZ4QRZFBSLMOR5BTBA3PG5YDHDGY';
const userSecret = 'SCGEGT7YDA4MY2XIVDHWCPOTX3WMKPODQUNHNY6V2WRDQHYKXSADGVQY';

describe('AuthController', () => {
  let authController: AuthController;
  let stellarService: StellarService;
  const mockConfig = {
    get: (key) => {
      const map = {
        app: {
          appName: 'apay.io',
        },
        stellar: {
          networkPassphrase: Networks.TESTNET,
          signingKey: account,
          getSecretForAccount(dummy: string) {
            return secret;
          }
        },
        TESTING_AUTH_DONT_VERIFY: false,
      };
      return map[key];
    }
  };

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      imports: [
        ConfigModule.forRoot({
          envFilePath: [process.cwd() + '/' + (process.env.NODE_ENV || '') + '.env'],
        }),
        JwtModule.register({
          secret: 'secret',
          signOptions: {
            expiresIn: '20m',
            issuer: 'app',
          },
        }),
      ],
      providers: [
        { provide: ConfigService, useValue: mockConfig},
        { provide: RedisService, useValue: {}},
        StellarService,
      ],
    }).compile();

    authController = app.get<AuthController>(AuthController);
    stellarService = app.get<StellarService>(StellarService);
  });

  describe('/auth', () => {
    it('should generate challenge token', async () => {

      const result = await authController.challenge({ account: userAccount });
      expect(result.network_passphrase).toBe(Networks.TESTNET);
      expect(result.transaction.startsWith('AAAAAgAAAADUlRoMBwXDbMKPhPkaM4dTq8rG9dbXFNd9LMaGnixAygAAAMgAAAAAAAAAAAAAAAEAAAAAWznavwAAAABbOdvrAAAAAAAAAAIAAAABAAAAAK2uSN3prqGgdUsGENve6eX755COShktjo9DMINvN3AzAAAACgAAAAxhcGF5LmlvIGF1dGgAAAABAAAAQ')).toBeTruthy();
    });

    it('should validate signed token', async () => {
      const challenge = await authController.challenge({ account: userAccount });

      const tx = new Transaction(challenge.transaction, Networks.TESTNET);
      tx.sign(Keypair.fromSecret(userSecret));

      spyOn(stellarService, 'getServer').and.returnValue({
        loadAccount: () => {
          return {
            thresholds: {
              med_threshold: 1,
            },
            signers: [
              {
                key: userAccount,
                weight: 1
              }
            ]
          };
        }
      });
      expect(await authController.token({
        transaction: tx.toEnvelope().toXDR('base64')
      })).toMatchObject({token: expect.anything()});
    });

    it('should validate signed token for non-existent account', async () => {
      const challenge = await authController.challenge({ account: userAccount });

      const tx = new Transaction(challenge.transaction, Networks.TESTNET);
      tx.sign(Keypair.fromSecret(userSecret));
      spyOn(stellarService, 'getServer').and.returnValue({
        loadAccount: () => {
          throw new NotFoundError('not found', {});
        }
      });
      expect(await authController.token({
        transaction: tx.toEnvelope().toXDR('base64')
      })).toMatchObject({token: expect.anything()});
    });

    it('should throw during token validation for unsigned transaction', async () => {
      const challenge = await authController.challenge({ account: userAccount });

      spyOn(stellarService, 'getServer').and.returnValue({
        loadAccount: () => {
          throw new NotFoundError('not found', {});
        }
      });
      expect(authController.token({
        transaction: challenge.transaction
      })).rejects.toThrow();
    });
  });
});
