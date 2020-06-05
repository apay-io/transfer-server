import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
  ValidationOptions,
  registerDecorator
} from 'class-validator';
import assets from '../config/assets';

@ValidatorConstraint()
export class IsKnownAssetConstraint implements ValidatorConstraintInterface {
  validate(asset: string, args: ValidationArguments) {
    return assets().raw.find((item) => item.code === asset);
  }

  defaultMessage(args: ValidationArguments) {
    return `Asset code ${args.value} is not valid!`;
  }
}

export function IsKnownAsset(validationOptions?: ValidationOptions) {
  return (object: any, propertyName: string) => {
    registerDecorator({
      propertyName,
      target: object.constructor,
      options: validationOptions,
      constraints: [],
      validator: IsKnownAssetConstraint,
    });
  };
}
