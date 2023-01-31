import {
  validate as core,
  ValidatorOptions,
  ValidationError,
} from 'class-validator';
import { Errors } from '../types';

const isEmpty = (value: object): boolean => Object.keys(value).length === 0;

const transformErrors = (errors: ValidationError[]): Errors | null => {
  const remapped = errors.reduce<Errors>(
    (errors, { property, constraints }) => {
      if (constraints && !isEmpty(constraints)) {
        errors[property] = Object.values(constraints);
      }
      return errors;
    },
    {}
  );

  return isEmpty(remapped) ? null : remapped;
};

export const validate = async (
  object: object,
  options?: ValidatorOptions
): Promise<Errors | null> => {
  const errors = await core(object, options);
  return transformErrors(errors);
};
