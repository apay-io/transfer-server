import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from 'nestjs-config';
import * as path from 'path';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      imports: [
        ConfigModule.load(
          path.resolve(__dirname, 'config/**/!(*.d).{ts,js}'),
          {path: process.cwd() + '/' + (process.env.NODE_ENV || '') + '.env'},
        ),
      ],
      providers: [AppService],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(appController.getHello()).toBe('Hello World!');
    });

    it('should generate stellar.toml', () => {
      const fakeReq = {headers: {host: 'https://apay.io'}};
      const response = appController.getStellarToml(fakeReq);

      expect(response).toContain('TRANSFER_SERVER="https://apay.io"');
      expect(response).toContain('[[CURRENCIES]]');
      expect(response).toContain('status="live"');
    });
  });
});
