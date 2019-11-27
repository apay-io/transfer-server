import { ValueTransformer } from 'typeorm';
import BigNumber from 'bignumber.js';

export class BigNumberToStringTransformer implements ValueTransformer {
  to(value: BigNumber): string {
    return value ? value.toString() : null;
  }

  from(value: string): BigNumber {
    return new BigNumber(value);
  }
}
