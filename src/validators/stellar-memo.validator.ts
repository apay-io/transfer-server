import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
  ValidationOptions,
  registerDecorator,
} from 'class-validator';
import { Memo } from 'stellar-sdk';

@ValidatorConstraint()
export class IsStellarMemoConstraint implements ValidatorConstraintInterface {
  validate(memo: string, args: ValidationArguments) {
    try {
      if ((args.object as any).memo_type === 'none') {
        return false;
      }
      const result = new Memo((args.object as any).memo_type, memo.toString());
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
