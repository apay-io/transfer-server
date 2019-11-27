import { ValueTransformer } from 'typeorm';

export class TrimStringTransformer implements ValueTransformer {
  to(value?: string): string {
    return (value || '').trim();
  }

  from(value?: string): string {
    return (value || '').trim();
  }
}
