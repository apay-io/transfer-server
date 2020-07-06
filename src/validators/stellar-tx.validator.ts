import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
  ValidationOptions,
  registerDecorator,
} from 'class-validator';
import { Transaction, Networks } from 'stellar-sdk';

@ValidatorConstraint()
export class IsStellarTxConstraint implements ValidatorConstraintInterface {
  validate(tx: string, args: ValidationArguments) {
    try {
      return !!(new Transaction(tx, Networks.PUBLIC));
    } catch (err) {
      return false;
    }
  }

  defaultMessage(args: ValidationArguments) {
    return `Stellar tx ${args.value} is not valid!`;
  }
}

export function IsStellarTx(validationOptions?: ValidationOptions) {
  return (object: any, propertyName: string) => {
    registerDecorator({
      propertyName,
      target: object.constructor,
      options: validationOptions,
      constraints: [],
      validator: IsStellarTxConstraint,
    });
  };
}
