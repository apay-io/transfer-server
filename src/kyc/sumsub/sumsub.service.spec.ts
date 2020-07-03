import { Test, TestingModule } from '@nestjs/testing';
import { SumsubService } from './sumsub.service';
import { HttpModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

describe('SumsubService', () => {
  let service: SumsubService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          envFilePath: [process.cwd() + '/' + (process.env.NODE_ENV || '') + '.env'],
        }),
        HttpModule
      ],
      providers: [SumsubService],
    }).compile();

    service = module.get<SumsubService>(SumsubService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('applicant created', async () => {
    const result = await service.createApplicant('0a58e90b-dc0a-4ed3-82e4-b3bd5177ea97');
    expect(result.status).toBe(201);
  });
});
