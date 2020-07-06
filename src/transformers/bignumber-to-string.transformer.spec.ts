import { TrimStringTransformer } from './trim-string.transformer';
import { BigNumberToStringTransformer } from './bignumber-to-string.transformer';
import BigNumber from 'bignumber.js';

describe('BigNumberToStringTransformer', () => {

  describe('converts string correctly', () => {
    it('correctly to', async () => {
      const transformer = new BigNumberToStringTransformer();
      expect(transformer.to(new BigNumber(0))).toBe('0');
      expect(transformer.to(new BigNumber(1000000).mul(1e12))).toBe('1000000000000000000');
      expect(transformer.to(new BigNumber(1e-6))).toBe('0.000001');
    });

    it('correctly from', async () => {
      const transformer = new BigNumberToStringTransformer();
      expect(transformer.from('1')).toBeInstanceOf(BigNumber);
      expect(transformer.from('10.00000001')).toBeInstanceOf(BigNumber);
    });
  });
});
