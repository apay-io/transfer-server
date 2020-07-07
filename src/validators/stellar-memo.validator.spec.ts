import { IsStellarMemoConstraint } from './stellar-memo.validator';

describe('IsStellarMemoContraint', () => {
  const validationOptions = {
    value: '',
    constraints: [],
    targetName: 'Memo',
    property: 'memo',
  };

  it('validates memo id correctly', async () => {
    const validator = new IsStellarMemoConstraint();
    expect(validator.validate('123', {
      ...validationOptions,
      object: {memo_type: 'id'}
    }))
      .toBeTruthy();

    expect(validator.validate('a12', {
      ...validationOptions,
      object: {memo_type: 'id'}
    }))
      .toBeFalsy();
  });

  it('validates memo text correctly', async () => {
    const validator = new IsStellarMemoConstraint();
    expect(validator.validate('12345678901234567890', {
      ...validationOptions,
      object: {memo_type: 'text'}
    }))
      .toBeTruthy();
    expect(validator.validate('123456789012345678901234567890', {
      ...validationOptions,
      object: {memo_type: 'text'}
    }))
      .toBeFalsy();
  });

  it('validates memo hash correctly', async () => {
    const validator = new IsStellarMemoConstraint();
    expect(validator.validate(
      'LJzf+U5apQ3FogYkkyU7eXgeuoCLP5QfrPoRAJE+5sU=',
      {
        value: '',
        constraints: [],
        targetName: 'Memo',
        property: 'memo',
        object: {memo_type: 'hash'}
      }))
      .toBeTruthy();
  });
});
