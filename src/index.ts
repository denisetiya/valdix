export type {
  ValdixIssue,
  IssueCode,
  SafeParseResult,
  SafeParseSuccess,
  SafeParseFailure,
  ParseOptions,
  LocaleCatalog,
} from "./core/types.js";

export type { Infer, Input } from "./core/schema.js";

export {
  Schema, ValdixError,
  OptionalSchema, NullableSchema, DefaultSchema, CatchSchema,
  BrandSchema, TransformSchema, PipeSchema,
  UnionSchema, IntersectionSchema,
} from "./core/schema.js";

export { useLang, registerLocale } from "./core/schema.js";
export { EN, ID, JP } from "./locales/index.js";

import { Schema, useLang, registerLocale } from "./core/schema.js";
import { EN } from "./locales/en.js";
import { ID } from "./locales/id.js";
import { JP } from "./locales/jp.js";
import {
  string, number, boolean, bigint, date,
  literal, enumValues, instanceOf,
  any, unknown, never, nullType, undefinedType, voidType,
  object, strictObject,
  array, tuple, record, set, map,
  union, intersection,
  discriminatedUnion, lazy,
  preprocess, coerce,
} from "./factories.js";

registerLocale("en", EN);
registerLocale("id", ID);
registerLocale("jp", JP);

export const v = {
  string, number, boolean, bigint, date,
  literal,
  enum: enumValues,
  instanceOf,
  any, unknown, never,
  null: nullType,
  undefined: undefinedType,
  void: voidType,
  object, strictObject,
  array, tuple, record, set, map,
  union, intersection,
  discriminatedUnion, lazy,
  preprocess, coerce,
  useLang, registerLocale,
};

export default v;
