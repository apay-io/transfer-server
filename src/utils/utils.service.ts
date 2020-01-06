import { HttpService, Injectable } from '@nestjs/common';

@Injectable()
export class UtilsService {

  constructor(
    private readonly httpService: HttpService,
  ) {
  }

  async getRates(): Promise<{ [key: string]: string }> {
    const result = await this.httpService.get('https://rates.apay.io').toPromise();
    result.data.TBTC = result.data.BTC;
    return result.data;
  }
}
