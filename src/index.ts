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
import { ZH } from "./locales/zh.js";
import { ZH_TW } from "./locales/zh-tw.js";
import { KO } from "./locales/ko.js";
import { FR } from "./locales/fr.js";
import { PT } from "./locales/pt.js";
import { NL } from "./locales/nl.js";
import { ES } from "./locales/es.js";
import { DE } from "./locales/de.js";
import { AR } from "./locales/ar.js";
import { RU } from "./locales/ru.js";
import { IT } from "./locales/it.js";
import { VI } from "./locales/vi.js";
import { HI } from "./locales/hi.js";
import { TH } from "./locales/th.js";

// Auto-register built-in locales (17 languages)
registerLocale("en", EN);
registerLocale("id", ID);
registerLocale("jp", JP);
registerLocale("zh", ZH);
registerLocale("zh-TW", ZH_TW);
registerLocale("ko", KO);
registerLocale("fr", FR);
registerLocale("pt", PT);
registerLocale("nl", NL);
registerLocale("es", ES);
registerLocale("de", DE);
registerLocale("ar", AR);
registerLocale("ru", RU);
registerLocale("it", IT);
registerLocale("vi", VI);
registerLocale("hi", HI);
registerLocale("th", TH);

export type { Infer, Input, StandardSchemaProps, SuperRefineCtx } from "./core/schema.js";
export { Schema, ValdixError, OptionalSchema, NullableSchema, DefaultSchema, CatchSchema, BrandSchema, TransformSchema, PipeSchema, UnionSchema, IntersectionSchema, RefineSchema, SuperRefineSchema } from "./core/schema.js";
export { StringSchema } from "./schemas/string.js";
export { NumberSchema, BooleanSchema } from "./schemas/number.js";
export { ObjectSchema, type ObjectShape } from "./schemas/object.js";
export { ArraySchema, TupleSchema } from "./schemas/array.js";
export { RecordSchema } from "./schemas/record.js";
export { DiscriminatedUnionSchema, LazySchema, SetSchema, MapSchema } from "./schemas/advanced.js";
export { FunctionSchema, PromiseSchema } from "./schemas/function.js";
export {
  DateSchema, LiteralSchema, EnumSchema, BigIntSchema, InstanceOfSchema, NativeEnumSchema,
  NeverSchema, AnySchema, UnknownSchema,
  NullSchema, UndefinedSchema, VoidSchema
} from "./schemas/primitives.js";
export { useLang, registerLocale, setErrorMap, getErrorMap, getLocales, jsonSchemaOf } from "./core/schema.js";
export type { ValdixIssue, IssueCode, SafeParseResult, SafeParseSuccess, SafeParseFailure, ParseOptions, LocaleCatalog, ErrorMap, PathSegment } from "./core/types.js";
export { EN, ID, JP, ZH, ZH_TW, KO, FR, PT, NL, ES, DE, AR, RU, IT, VI, HI, TH } from "./locales/index.js";
export { v, default } from "./factories.js";
