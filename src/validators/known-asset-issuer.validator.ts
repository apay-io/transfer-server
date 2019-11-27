import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
  ValidationOptions,
  registerDecorator
} from 'class-validator';
import assets from '../config/assets';

@ValidatorConstraint()
export class IsKnownAssetIssuerConstraint implements ValidatorConstraintInterface {
  validate(issuer: string, args: ValidationArguments) {
    return assets.find((item) => item.stellar.issuer === issuer);
  }

  defaultMessage(args: ValidationArguments) {
    return `Asset issuer ${args.value} is unknown!`;
  }
}

export function IsKnownAssetIssuer(validationOptions?: ValidationOptions) {
  return (object: any, propertyName: string) => {
    registerDecorator({
      propertyName,
      target: object.constructor,
      options: validationOptions,
      constraints: [],
      validator: IsKnownAssetIssuerConstraint,
    });
  };
}
