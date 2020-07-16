import validator from 'validator';
import 'reflect-metadata';

type ValidationFunction = (target: any, propertyKey:string, validatorOptions?:any) => string | void
type minMax = {minimum:number, maximum:number};
interface ValidationRule {
  validationOptions?:any;
  validator:ValidationFunction;
}

export function validate(object: any) {
  const keys = Reflect.getMetadata('validation:properties', object) as string[];
  let errorMap = {};

  if(!keys || !Array.isArray(keys)) {
    return errorMap;
  }

  for( const key of keys ){
    const rules:ValidationRule[] = Reflect.getMetadata('validation:rules', object, key) as ValidationRule[];
    if(!Array.isArray(rules)) {
      continue;
    }

    for(const rule of rules) {
      const errorMessage = rule.validator(object, key, rule.validationOptions);
      if(errorMessage) {
        errorMap[key] = errorMap[key] || [];
        errorMap[key].push(errorMessage);
      }
    }
  }
  return errorMap;
}

function addValidation(target:any, propertyKey:string, validator:ValidationFunction, validationOptions?:any) {
  let objectProperties:string[] = Reflect.getMetadata('validation:properties', target) || [];
  if(!objectProperties.includes(propertyKey)) {
    objectProperties.push(propertyKey);
    Reflect.defineMetadata('validation:properties', objectProperties, target);
  }

  let validators:ValidationRule[] = Reflect.getMetadata('validation:rules', target, propertyKey) || [];
  let validationRule = {
    validator,
    validationOptions
  }
  
  validators.push(validationRule);
  Reflect.defineMetadata('validation:rules', validators, target, propertyKey);
}

function requireValidator(target:any, propertyKey:string): string | void {
  let value = target[propertyKey];
  if(value){
    return;
  }
  return `Property ${propertyKey} is required.`
}

function emailValidator(target:any, propertyKey:string): string | void {
  let value = target[propertyKey];
  if(value === null) {
    return;
  }

  const isValid = validator.isEmail(value);
  if(!isValid){
    return `Property ${propertyKey} must be a valid email.`
  }
  return;
}

function integerValidator(target:any, propertyKey:string, validationOptions:any):string | void {
  const value = target[propertyKey];
  if(value === null){
    return;
  }

  let {minimum, maximum}:minMax = validationOptions as minMax;

  const errorMessage = `Property ${propertyKey} must be an integer between ${minimum} and ${maximum} in length`;

  if(!Number.isInteger(value)) {
    return errorMessage;
  }
  if(value <= maximum && value >= minimum ){
    return;
  }
  return errorMessage;
}

function lengthValidator(target:any, propertyKey:string, validationOptions:any):string | void {
  let {minimum:min, maximum:max}:minMax = validationOptions as minMax;
  const isValid = validator.isLength(target[propertyKey], {min, max});
  if(!isValid){
    return `Property ${propertyKey} must be a string between ${min} and ${max} in length`;
  }
  return;
}

function phoneValidator(target:any, propertyKey:string, validationOptions:any):string | void {
  let value = target[propertyKey];
  if(value == null) {
    return;
  }
  const isValid = validator.isMobilePhone(value);
  if(!isValid){
    return `Property ${propertyKey} must be a valid phone number.`
  }
  return;
}

export function isEmail(target:any, propertyKey: string) {
  addValidation(target, propertyKey, emailValidator)
}

export function required(target:any, propertyKey:string) {
  addValidation(target, propertyKey, requireValidator);
}

export function isPhone(target:any, propertyKey:string) {
  addValidation(target, propertyKey, phoneValidator)
}

export function length(minimum:number, maximum:number) {
  return function (target:any, propertyKey:string) {
    addValidation(target, propertyKey, lengthValidator, {minimum, maximum});
  }
}

export function isInteger(minimum:number, maximum:number) {
  return function (target:any, propertyKey:string) {
    addValidation(target, propertyKey, integerValidator, {minimum, maximum})
  }
}