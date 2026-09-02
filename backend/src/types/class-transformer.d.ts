declare module 'class-transformer' {
  export function plainToInstance<T>(cls: new (...args: any[]) => T, plain: any): T;
  export function plainToClass<T>(cls: new (...args: any[]) => T, plain: any): T;
  export function classToPlain(instance: any): any;
  export function instanceToPlain(instance: any): any;
  export function plainToClassFromExist(cls: any, plain: any): any;
}
