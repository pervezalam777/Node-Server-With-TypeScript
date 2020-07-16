import 'reflect-metadata';

export type EntityTypeInstance<T> = new (...args:any[]) => T;

export interface IEntity {
  getPersistanceObject():any;
}

export class EntityFactory {
  static fromPersistenceObject<T extends IEntity>(obj:Object, type: EntityTypeInstance<T>):T {
    let output = new type();
    const persistedProperties: string[] = Reflect.getMetadata('entity:properties', output) || [];
    const idProperty = Reflect.getMetadata('entity:id', output);
    const props = Object.keys(obj);
    for(const prop of props) {
      if(persistedProperties.includes(prop) || prop == idProperty){
        output[prop] = obj[prop];
      } else {
        throw new Error('Property not defined in class');
      }
    }
    return output;
  }
}

export default class BaseEntity implements IEntity {
  getPersistanceObject(): any {
    let output = {};
    const persistedProperties: string[] = Reflect.getMetadata('entity:properties', this) || [];
    const idProperty = Reflect.getMetadata('entity:id', this);
    output[idProperty] = this[idProperty];
    for(const prop of persistedProperties){
      if(this[prop]){
        output[prop] = this[prop]
      }
    }
    return output;
  }
}