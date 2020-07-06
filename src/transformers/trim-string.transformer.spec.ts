import { TrimStringTransformer } from './trim-string.transformer';

describe('TrimStringTransformer', () => {

  describe('trim string transformer', () => {
    it('trims correctly to', async () => {
      const transformer = new TrimStringTransformer();
      expect(transformer.to(' something')).toBe('something');
      expect(transformer.to(' something ')).toBe('something');
      expect(transformer.to('something ')).toBe('something');
      expect(transformer.to(null)).toBe('');
    });

    it('trims correctly from', async () => {
      const transformer = new TrimStringTransformer();
      expect(transformer.from(' something')).toBe('something');
      expect(transformer.from(' something ')).toBe('something');
      expect(transformer.from('something ')).toBe('something');
      expect(transformer.from(null)).toBe('');
    });
  });
});
