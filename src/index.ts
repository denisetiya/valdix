/**
 * Valdix — multi-language casual-error validation library.
 *
 * @example
 * ```ts
 * import { v } from "valdix";
 *
 * const schema = v.object({
 *   name: v.string().min(3, "Minimal 3 karakter"),
 *   email: v.string().email(),
 *   age: v.number().int().min(0),
 * });
 *
 * const r = schema.safeParse({ name: "ab", email: "bad", age: -1 });
 * if (!r.success) console.log(r.errors);
 * ```
 */
import { Schema, ValdixError, registerLocale } from "./core/schema.js";
import { EN } from "./locales/en.js";
import { ID } from "./locales/id.js";
import { JP } from "./locales/jp.js";

// Auto-register built-in locales
registerLocale("en", EN);
registerLocale("id", ID);
registerLocale("jp", JP);

export type { Infer, Input, StandardSchemaProps, SuperRefineCtx } from "./core/schema.js";
export { Schema, ValdixError, OptionalSchema, NullableSchema, DefaultSchema, CatchSchema, BrandSchema, TransformSchema, PipeSchema, UnionSchema, IntersectionSchema, RefineSchema, SuperRefineSchema } from "./core/schema.js";
export { useLang, registerLocale, setErrorMap, getErrorMap, getLocales, jsonSchemaOf } from "./core/schema.js";
export type { ValdixIssue, IssueCode, SafeParseResult, SafeParseSuccess, SafeParseFailure, ParseOptions, LocaleCatalog, ErrorMap, PathSegment } from "./core/types.js";
export { EN, ID, JP } from "./locales/index.js";
export { v, default } from "./factories.js";
