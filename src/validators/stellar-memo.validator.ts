import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
  ValidationOptions,
  registerDecorator,
} from 'class-validator';
import { Memo, MemoReturn, MemoHash, MemoNone } from 'stellar-sdk';

@ValidatorConstraint()
export class IsStellarMemoConstraint implements ValidatorConstraintInterface {
  validate(memo: string, args: ValidationArguments) {
    const memoType = (args.object as any).memo_type;
    try {
      if (memoType === MemoNone) {
        return false;
      }
      if (memoType === MemoHash || memoType === MemoReturn) {
        const result = new Memo(memoType, Buffer.from(memo, 'base64').toString('hex'));
      } else {
        const result = new Memo(memoType, memo.toString());
      }
      return true;
    } catch (err) {
      return false;
    }
  }

  defaultMessage(args: ValidationArguments) {
    return `Memo ${args.value} is not valid!`;
  }
}

export function IsStellarMemo(validationOptions?: ValidationOptions) {
  return (object: any, propertyName: string) => {
    registerDecorator({
      propertyName,
      target: object.constructor,
      options: validationOptions,
      constraints: [],
      validator: IsStellarMemoConstraint,
    });
  };
}
