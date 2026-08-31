/* eslint-disable @typescript-eslint/no-explicit-any */

// Minimal type stubs for @nestjs/swagger — the installed package is missing declarations
declare module '@nestjs/swagger' {
  // Decorators that can be used on both classes and methods
  export function ApiTags(...tags: string[]): any;
  export function ApiBearerAuth(): any;
  export function ApiOperation(options: Record<string, any>): any;
  export function ApiResponse(options: Record<string, any>): any;
  export function ApiProperty(options?: Record<string, any>): any;
  export function ApiPropertyOptional(options?: Record<string, any>): any;
  export function ApiQuery(options: Record<string, any>): any;

  export class DocumentBuilder {
    setTitle(title: string): this;
    setDescription(desc: string): this;
    setVersion(v: string): this;
    addBearerAuth(): this;
    build(): any;
  }

  export class SwaggerModule {
    static createDocument(app: any, config: any): any;
    static setup(path: string, app: any, document: any): void;
  }

  export function OmitType<T, K extends keyof T>(classRef: new () => T, keys: K[]): any;
  export function PartialType<T>(classRef: new () => T): any;
  export function IntersectionType<T, U>(classA: new () => T, classB: new () => U): any;
}
