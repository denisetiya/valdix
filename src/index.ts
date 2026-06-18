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

export { Schema, ValdixError } from "./core/schema.js";
export { useLang, registerLocale } from "./core/schema.js";
export { EN, ID, JP } from "./locales/index.js";

import { Schema, useLang, registerLocale } from "./core/schema.js";
import { EN } from "./locales/en.js";
import { ID } from "./locales/id.js";
import { JP } from "./locales/jp.js";
import {
  string, number, boolean, date,
  literal, enumValues,
  any, unknown, never, nullType, undefinedType, voidType,
  object, strictObject,
  array, tuple, record,
  union, intersection,
  discriminatedUnion, lazy,
} from "./factories.js";

// Register built-in locales on import
registerLocale("en", EN);
registerLocale("id", ID);
registerLocale("jp", JP);

export const v = {
  string,
  number,
  boolean,
  date,
  literal,
  enum: enumValues,
  any,
  unknown,
  never,
  null: nullType,
  undefined: undefinedType,
  void: voidType,
  object,
  strictObject,
  array,
  tuple,
  record,
  union,
  intersection,
  discriminatedUnion,
  lazy,
  useLang,
  registerLocale,
};

export default v;
