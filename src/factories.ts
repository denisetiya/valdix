import { StringSchema } from "./schemas/string.js";
import { NumberSchema, BooleanSchema } from "./schemas/number.js";
import {
  DateSchema, LiteralSchema, EnumSchema,
  NeverSchema, AnySchema, UnknownSchema,
  NullSchema, UndefinedSchema, VoidSchema
} from "./schemas/primitives.js";
import { ObjectSchema, type ObjectShape } from "./schemas/object.js";
import { ArraySchema, TupleSchema } from "./schemas/array.js";
import { RecordSchema } from "./schemas/record.js";
import { DiscriminatedUnionSchema, LazySchema } from "./schemas/advanced.js";
import { Schema } from "./core/schema.js";

export const string = () => new StringSchema();
export const number = () => new NumberSchema();
export const boolean = () => new BooleanSchema();
export const date = () => new DateSchema();
export const literal = <T extends string | number | boolean | null | undefined>(val: T) =>
  new LiteralSchema(val);
export const enumValues = <T extends readonly [string, ...string[]]>(options: T) =>
  new EnumSchema(options);
export const never = () => new NeverSchema();
export const any = () => new AnySchema();
export const unknown = () => new UnknownSchema();
export const nullType = () => new NullSchema();
export const undefinedType = () => new UndefinedSchema();
export const voidType = () => new VoidSchema();

export const object = <T extends ObjectShape>(shape: T) => new ObjectSchema(shape);
export const strictObject = <T extends ObjectShape>(shape: T) => new ObjectSchema(shape, "strict");

export const array = <T extends Schema<any, any>>(item: T) => new ArraySchema(item);
export const tuple = <T extends Schema<any, any>[]>(...items: T) => new TupleSchema(items);
export const record = <K extends Schema<string>, V extends Schema<any, any>>(key: K, value: V) =>
  new RecordSchema(key, value);

export const union = <T extends Schema<any, any>[]>(schemas: T) =>
  schemas.reduce((acc, s) => (acc ? acc.or(s) : s), undefined as unknown as Schema) as Schema<any>;

export const intersection = <A extends Schema<any, any>, B extends Schema<any, any>>(left: A, right: B) =>
  left.and(right);

export const discriminatedUnion = <TKey extends string, TSchemas extends Record<string, Schema<any, any>>>(
  key: TKey,
  schemas: TSchemas
) => new DiscriminatedUnionSchema(key, schemas);

export const lazy = <T extends Schema<any, any>>(getter: () => T) => new LazySchema(getter);
