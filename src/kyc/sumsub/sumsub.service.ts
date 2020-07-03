import { HttpService, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac } from 'crypto';

@Injectable()
export class SumsubService {

  constructor(
    private readonly config: ConfigService,
    private readonly http: HttpService,
  ) {
  }

  async accessToken(userId: string) {
    return this.request('POST', '/resources/accessTokens', {
      userId,
      ttlInSecs: 1200,
    })
      .then(response => {
        return response.data;
      });
  }

  async createApplicant(userId: string) {
    return this.request('POST', '/resources/applicants', {
      applicant: {
        externalUserId: userId,
        requiredIdDocs: {
          docSets: [
            {
              idDocSetType: 'IDENTITY',
              types: [
                'PASSPORT',
                'ID_CARD',
                'DRIVERS',
                'RESIDENCE_PERMIT'
              ]
            },
            {
              idDocSetType: 'SELFIE2',
              types: [
                'SELFIE2'
              ]
            }
          ]
        }
      }
    })
      .then((response) => {
        return response.data;
      });
  }

  request(method: string, path: string, data: object) {
    const ts = Math.floor(Date.now() / 1000).toString();
    const requestConfig = {
      headers: {
        'Content-Type': 'application/json',
        'X-App-Token': this.config.get<string>('SUMSUB_TOKEN'),
        'X-App-Access-Sig': this.sign(ts, method, '/resources/applicants',data && JSON.stringify(data)),
        'X-App-Access-Ts': ts,
      }
    };
    return (method === 'POST'
      ? this.http.post(this.config.get<string>('SUMSUB_BASEURL') + path, JSON.stringify(data), requestConfig)
      : this.http.get(this.config.get<string>('SUMSUB_BASEURL') + path, requestConfig)
    ).toPromise();
  }

  sign(ts: string, method: string, path: string, data: string) {
    return createHmac('sha256', this.config.get<string>('SUMSUB_SECRET'))
      .update(ts + method + path + data)
      .digest('hex');
  }
}
