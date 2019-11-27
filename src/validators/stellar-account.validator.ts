import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
  ValidationOptions,
  registerDecorator,
} from 'class-validator';
import { StrKey } from 'stellar-sdk';

@ValidatorConstraint()
export class IsStellarAccountConstraint implements ValidatorConstraintInterface {
  validate(account: string, args: ValidationArguments) {
    return StrKey.isValidEd25519PublicKey(account);
  }

  defaultMessage(args: ValidationArguments) {
    return `Stellar account ${args.value} is not valid!`;
  }
}

export function IsStellarAccount(validationOptions?: ValidationOptions) {
  return (object: any, propertyName: string) => {
    registerDecorator({
      propertyName,
      target: object.constructor,
      options: validationOptions,
      constraints: [],
      validator: IsStellarAccountConstraint,
    });
  };
}
