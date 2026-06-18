import { StringSchema } from "./schemas/string.js";
import { NumberSchema, BooleanSchema } from "./schemas/number.js";
import {
  DateSchema, LiteralSchema, EnumSchema, BigIntSchema, InstanceOfSchema, NativeEnumSchema,
  NeverSchema, AnySchema, UnknownSchema,
  NullSchema, UndefinedSchema, VoidSchema
} from "./schemas/primitives.js";
import { ObjectSchema, type ObjectShape } from "./schemas/object.js";
import { ArraySchema, TupleSchema } from "./schemas/array.js";
import { RecordSchema } from "./schemas/record.js";
import { DiscriminatedUnionSchema, LazySchema, SetSchema, MapSchema } from "./schemas/advanced.js";
import { FunctionSchema, PromiseSchema } from "./schemas/function.js";
import { Schema, TransformSchema, PipeSchema, OptionalSchema, NullableSchema, DefaultSchema, CatchSchema, BrandSchema, type Infer, type Input } from "./core/schema.js";

// ── Primitives ──
export const string = () => new StringSchema();
export const number = () => new NumberSchema();
export const boolean = () => new BooleanSchema();
export const bigint = () => new BigIntSchema();
export const date = () => new DateSchema();
export const literal = <T extends string | number | boolean | null | undefined>(val: T) => new LiteralSchema(val);
export const enumValues = <T extends readonly [string, ...string[]]>(options: T) => new EnumSchema(options);
export const nativeEnum = <T extends Record<string, string | number>>(obj: T) => new NativeEnumSchema(obj);
export const instanceOf = <T extends abstract new (...args: any[]) => any>(cls: T) => new InstanceOfSchema(cls);
export const never = () => new NeverSchema();
export const any = () => new AnySchema();
export const unknown = () => new UnknownSchema();
export const nullType = () => new NullSchema();
export const undefinedType = () => new UndefinedSchema();
export const voidType = () => new VoidSchema();

// ── Objects ──
export const object = <T extends ObjectShape>(shape: T) => new ObjectSchema(shape, "strip");
export const strictObject = <T extends ObjectShape>(shape: T) => new ObjectSchema(shape, "strict");

// ── Collections ──
export const array = <T extends Schema<any, any>>(item: T) => new ArraySchema(item);
export const tuple = <T extends Schema<any, any>[]>(...items: T) => new TupleSchema(items);
export const record = <K extends Schema<string>, V extends Schema<any, any>>(key: K, value: V) => new RecordSchema(key, value);
export const set = <T extends Schema<any, any>>(item: T) => new SetSchema(item);
export const map = <K extends Schema<any, any>, V extends Schema<any, any>>(key: K, value: V) => new MapSchema(key, value);

// ── Union / Intersection ──
export const union = <T extends Schema<any, any>[]>(schemas: T): T extends [infer First] ? (First extends Schema<any, any> ? First : never) : Schema<any> =>
  schemas.length === 1 ? schemas[0] as any : schemas.reduce((acc, s) => acc.or(s)) as any;

export const intersection = <A extends Schema<any, any>, B extends Schema<any, any>>(left: A, right: B) => left.and(right);

// ── Advanced ──
export const discriminatedUnion = <TKey extends string, TSchemas extends Record<string, Schema<any, any>>>(
  key: TKey, schemas: TSchemas
) => new DiscriminatedUnionSchema(key, schemas);

export const lazy = <T extends Schema<any, any>>(getter: () => T) => new LazySchema(getter);

// ── Preprocess / Coerce ──
export const preprocess = <TNext>(fn: (input: unknown) => TNext, schema: Schema<TNext>): PipeSchema<unknown, unknown, TNext> => {
  const pre = new TransformSchema<unknown, unknown, TNext>(
    new AnySchema() as unknown as Schema<unknown, unknown>,
    (input: unknown) => fn(input)
  );
  return new PipeSchema(pre as any, schema as any) as any;
};

export const coerce = {
  string: () => preprocess((v) => String(v ?? ""), string()),
  number: () => preprocess((v) => Number(v), number()),
  boolean: () => preprocess((v) => v === "false" || v === false ? false : Boolean(v), boolean()),
  bigint: () => preprocess((v) => typeof v === "bigint" ? v : BigInt(Number(v)), bigint()),
  date: () => preprocess((v) => v instanceof Date ? v : new Date(String(v)), date()),
};

// ── Function / Promise ──
/** Schema for function arguments and return values. */
export const fn = () => new FunctionSchema();
/** Schema for a Promise's resolved value. */
export const promise = <T extends Schema<any, any>>(inner: T) => new PromiseSchema(inner);

// ── Re-exports ──
export type { Infer, Input };

// ── v namespace (default & named export) ──
import { useLang as _useLang, registerLocale as _registerLocale, setErrorMap as _setErrorMap } from "./core/schema.js";

/** Single namespace bundling all schema factories. */
export const v = {
  string, number, boolean, bigint, date,
  literal, enum: enumValues, nativeEnum, instanceOf,
  any, unknown, never,
  null: nullType,
  undefined: undefinedType,
  void: voidType,
  object, strictObject,
  array, tuple, record, set, map,
  union, intersection,
  discriminatedUnion, lazy,
  function: fn, promise,
  preprocess, coerce,
  useLang: _useLang, registerLocale: _registerLocale, setErrorMap: _setErrorMap,
};

export default v;
