import type { ParseOptions, SafeParseResult, ValdixIssue, ErrorMap, PathSegment } from "./types.js";
import { createParseContext, ok, invalid, type InternalResult, type ParseContext } from "./context.js";
import type { LocaleCatalog } from "./types.js";

let defaultLang = "en";
let errorMap: ErrorMap | undefined = undefined;
const localeRegistry = new Map<string, LocaleCatalog>();

export const useLang = (lang: string): void => { defaultLang = lang; };
export const registerLocale = (lang: string, catalog: LocaleCatalog): void => { localeRegistry.set(lang, catalog); };
export const getLocales = (): Map<string, LocaleCatalog> => localeRegistry;
export const setErrorMap = (fn: ErrorMap | undefined): void => { errorMap = fn; };
export const getErrorMap = (): ErrorMap | undefined => errorMap;

export type Infer<T extends Schema<any, any>> = T extends Schema<infer O, any> ? O : never;
export type Input<T extends Schema<any, any>> = T extends Schema<any, infer I> ? I : never;

// ─── Standard Schema interface (https://standardschema.dev) ───
export interface StandardSchemaProps<I, O> {
  version: 1;
  vendor: "valdix";
  validate: (value: unknown) => StandardSchemaResult<I, O>;
  types?: { input: I; output: O };
}
export type StandardSchemaResult<I, O> = StandardSchemaSuccess<O> | StandardSchemaFailure<I>;
export interface StandardSchemaSuccess<O> { value: O; issues?: undefined; }
export interface StandardSchemaFailure<I> {
  issues: ReadonlyArray<{ message: string; path?: ReadonlyArray<PathSegment | PropertyKey> }>;
}

export abstract class Schema<TOutput = unknown, TInput = TOutput> {
  readonly _output!: TOutput;
  readonly _input!: TInput;
  description?: string;

  // Cycle protection during parse
  protected _parseGuarded(input: unknown, ctx: ParseContext, seen: Set<object>): InternalResult<TOutput> {
    if (seen.has(this as unknown as object)) {
      return ok(input as TOutput);
    }
    seen.add(this as unknown as object);
    const result = this._parseWithContext(input, ctx);
    seen.delete(this as unknown as object);
    return result;
  }

  _parseWithContext(input: unknown, ctx: ParseContext): InternalResult<TOutput> {
    if (this.description) {
      ctx.descriptionStack.push(this.description);
    }
    const r = this._parse(input, ctx);
    if (this.description) ctx.descriptionStack.pop();
    return r;
  }

  abstract _parse(input: unknown, ctx: ParseContext): InternalResult<TOutput>;

  parse(input: unknown, options?: ParseOptions): TOutput {
    const ctx = createParseContext(options, localeRegistry, defaultLang, errorMap);
    const result = this._parseGuarded(input, ctx, new Set<object>());
    if (!result.ok || ctx.issues.length > 0) throw new ValdixError(ctx.issues);
    return result.value;
  }

  safeParse(input: unknown, options?: ParseOptions): SafeParseResult<TOutput> {
    const ctx = createParseContext(options, localeRegistry, defaultLang, errorMap);
    const result = this._parseGuarded(input, ctx, new Set<object>());
    if (result.ok && ctx.issues.length === 0) return { success: true, data: result.value };
    return { success: false, errors: ctx.issues };
  }

  async parseAsync(input: unknown, options?: ParseOptions): Promise<TOutput> {
    const ctx = createParseContext(options, localeRegistry, defaultLang, errorMap);
    const result = await this._parseAsync(input, ctx, new Set<object>());
    if (!result.ok || ctx.issues.length > 0) throw new ValdixError(ctx.issues);
    return result.value;
  }

  async safeParseAsync(input: unknown, options?: ParseOptions): Promise<SafeParseResult<TOutput>> {
    const ctx = createParseContext(options, localeRegistry, defaultLang, errorMap);
    const result = await this._parseAsync(input, ctx, new Set<object>());
    if (result.ok && ctx.issues.length === 0) return { success: true, data: result.value };
    return { success: false, errors: ctx.issues };
  }

  async _parseAsync(input: unknown, ctx: ParseContext, seen: Set<object>): Promise<InternalResult<TOutput>> {
    if (seen.has(this as unknown as object)) return ok(input as TOutput);
    seen.add(this as unknown as object);
    if (this.description) ctx.descriptionStack.push(this.description);
    const r = await this._parseAsyncInner(input, ctx);
    if (this.description) ctx.descriptionStack.pop();
    seen.delete(this);
    return r;
  }

  protected async _parseAsyncInner(input: unknown, ctx: ParseContext): Promise<InternalResult<TOutput>> {
    return this._parse(input, ctx);
  }

  // ── Modifiers ──
  optional(): OptionalSchema<Schema<TOutput, TInput>> {
    if (this instanceof OptionalSchema) return this as unknown as OptionalSchema<Schema<TOutput, TInput>>;
    return new OptionalSchema(this as unknown as Schema<TOutput, TInput>);
  }
  nullable(): NullableSchema<Schema<TOutput, TInput>> {
    if (this instanceof NullableSchema) return this as unknown as NullableSchema<Schema<TOutput, TInput>>;
    return new NullableSchema(this as unknown as Schema<TOutput, TInput>);
  }
  nullish(): OptionalSchema<NullableSchema<Schema<TOutput, TInput>>> {
    if (this instanceof OptionalSchema && this.inner instanceof NullableSchema) {
      return this as unknown as OptionalSchema<NullableSchema<Schema<TOutput, TInput>>>;
    }
    return new OptionalSchema(new NullableSchema(this as unknown as Schema<TOutput, TInput>));
  }
  default(value: TOutput | (() => TOutput)): DefaultSchema<TOutput, TInput> {
    return new DefaultSchema(this as unknown as Schema<TOutput, TInput>, value);
  }
  catch(value: TOutput | ((err: ValdixIssue[]) => TOutput)): CatchSchema<TOutput, TInput> {
    return new CatchSchema(this as unknown as Schema<TOutput, TInput>, value);
  }
  transform<TNext>(fn: (value: TOutput) => TNext): TransformSchema<TOutput, TInput, TNext> {
    return new TransformSchema(this as unknown as Schema<TOutput, TInput>, fn);
  }
  pipe<TNext>(schema: Schema<TNext, TOutput>): PipeSchema<TOutput, TInput, TNext> {
    return new PipeSchema(this as unknown as Schema<TOutput, TInput>, schema);
  }
  or<T extends Schema<any, any>>(schema: T): UnionSchema<[Schema<unknown, unknown>, T]> {
    return new UnionSchema([this as unknown as Schema<unknown, unknown>, schema]);
  }
  and<T extends Schema<any, any>>(schema: T): IntersectionSchema<Schema<unknown, unknown>, T> {
    return new IntersectionSchema(this as unknown as Schema<unknown, unknown>, schema);
  }
  refine(check: (value: TOutput) => boolean | string | IssueInput): RefineSchema<TOutput, TInput> {
    return new RefineSchema(this as unknown as Schema<TOutput, TInput>, check);
  }
  superRefine(check: (value: TOutput, ctx: SuperRefineCtx) => void | Promise<void>): SuperRefineSchema<TOutput, TInput> {
    return new SuperRefineSchema(this as unknown as Schema<TOutput, TInput>, check);
  }
  brand<TBrand extends string>(_name?: TBrand): BrandSchema<TOutput, TInput, TBrand> {
    return new BrandSchema(this as unknown as Schema<TOutput, TInput>);
  }
  describe(text: string): this {
    this.description = text;
    return this;
  }
  readonly(): this {
    Object.freeze(this);
    return this;
  }
  toJSONSchema(): unknown {
    return jsonSchemaOf(this);
  }
  "~standard"<I = TInput, O = TOutput>(): StandardSchemaProps<I, O> {
    const schema = this;
    return {
      version: 1,
      vendor: "valdix",
      validate: (value: unknown) => {
        const r = schema.safeParse(value);
        if (r.success) return { value: r.data as unknown as O };
        return { issues: r.errors.map((i) => ({ message: i.message, path: i.path as any })) };
      },
      types: { input: undefined as any, output: undefined as any },
    };
  }
}

// ── Modifiers ──

export class OptionalSchema<T extends Schema<any, any>> extends Schema<T["_output"] | undefined, T["_input"] | undefined> {
  constructor(readonly inner: T) { super(); }
  _parse(input: unknown, ctx: ParseContext): InternalResult<T["_output"] | undefined> {
    if (input === undefined) return ok(undefined);
    return this.inner._parseWithContext(input, ctx);
  }
}

export class NullableSchema<T extends Schema<any, any>> extends Schema<T["_output"] | null, T["_input"] | null> {
  constructor(readonly inner: T) { super(); }
  _parse(input: unknown, ctx: ParseContext): InternalResult<T["_output"] | null> {
    if (input === null) return ok(null);
    return this.inner._parseWithContext(input, ctx);
  }
}

export class DefaultSchema<TOutput, TInput> extends Schema<TOutput, TInput | undefined> {
  constructor(
    private readonly inner: Schema<TOutput, TInput>,
    private readonly fallback: TOutput | (() => TOutput)
  ) { super(); }
  _parse(input: unknown, ctx: ParseContext): InternalResult<TOutput> {
    const value = input === undefined
      ? typeof this.fallback === "function" ? (this.fallback as () => TOutput)() : this.fallback
      : input;
    return this.inner._parseWithContext(value, ctx);
  }
}

export class CatchSchema<TOutput, TInput> extends Schema<TOutput, TInput> {
  constructor(
    private readonly inner: Schema<TOutput, TInput>,
    private readonly fallback: TOutput | ((err: ValdixIssue[]) => TOutput)
  ) { super(); }
  _parse(input: unknown, ctx: ParseContext): InternalResult<TOutput> {
    const child = ctx.fork();
    const result = this.inner._parseWithContext(input, child);
    if (result.ok && child.issues.length === 0) return result;
    const value = typeof this.fallback === "function"
      ? (this.fallback as (err: ValdixIssue[]) => TOutput)(child.issues)
      : this.fallback;
    return ok(value);
  }
}

export class BrandSchema<TOutput, TInput, TBrand extends string> extends Schema<TOutput & { readonly __brand: TBrand }, TInput> {
  constructor(private readonly inner: Schema<TOutput, TInput>) { super(); }
  _parse(input: unknown, ctx: ParseContext): InternalResult<TOutput & { readonly __brand: TBrand }> {
    return this.inner._parseWithContext(input, ctx) as InternalResult<any>;
  }
}

export class TransformSchema<TOutput, TInput, TNext> extends Schema<TNext, TInput> {
  constructor(readonly inner: Schema<TOutput, TInput>, private readonly fn: (value: TOutput) => TNext) { super(); }
  _parse(input: unknown, ctx: ParseContext): InternalResult<TNext> {
    const parsed = this.inner._parseWithContext(input, ctx);
    if (!parsed.ok) return invalid;
    try { return ok(this.fn(parsed.value)); }
    catch { ctx.addIssue({ code: "custom", message: "Transform failed" }); return invalid; }
  }
}

export class PipeSchema<TOutput, TInput, TNext> extends Schema<TNext, TInput> {
  constructor(
    private readonly first: Schema<TOutput, TInput>,
    private readonly second: Schema<TNext, TOutput>
  ) { super(); }
  _parse(input: unknown, ctx: ParseContext): InternalResult<TNext> {
    const first = this.first._parseWithContext(input, ctx);
    if (!first.ok) return invalid;
    return this.second._parseWithContext(first.value, ctx);
  }
}

export type IssueInput = { code?: string; message?: string; path?: (string | number)[] } & Record<string, unknown>;

export class RefineSchema<TOutput, TInput> extends Schema<TOutput, TInput> {
  constructor(
    private readonly inner: Schema<TOutput, TInput>,
    private readonly check: (value: TOutput) => boolean | string | IssueInput
  ) { super(); }
  _parse(input: unknown, ctx: ParseContext): InternalResult<TOutput> {
    const parsed = this.inner._parseWithContext(input, ctx);
    if (!parsed.ok) return invalid;
    let result: boolean | string | IssueInput;
    try { result = this.check(parsed.value); }
    catch { ctx.addIssue({ code: "custom", message: "Refinement error" }); return invalid; }
    if (result === true) return parsed;
    if (result === false) { ctx.addIssue({ code: "custom" }); return invalid; }
    if (typeof result === "string") { ctx.addIssue({ code: "custom", message: result }); return invalid; }
    ctx.addIssue({ code: (result.code as any) ?? "custom", message: result.message, ...result } as any);
    return invalid;
  }
  protected async _parseAsyncInner(input: unknown, ctx: ParseContext): Promise<InternalResult<TOutput>> {
    const parsed = await this.inner._parseAsync(input, ctx, new Set());
    if (!parsed.ok) return invalid;
    let result: boolean | string | IssueInput;
    try {
      const r = this.check(parsed.value);
      result = r instanceof Promise ? await r : r;
    } catch { ctx.addIssue({ code: "custom", message: "Refinement error" }); return invalid; }
    if (result === true) return parsed;
    if (result === false) { ctx.addIssue({ code: "custom" }); return invalid; }
    if (typeof result === "string") { ctx.addIssue({ code: "custom", message: result }); return invalid; }
    ctx.addIssue({ code: (result.code as any) ?? "custom", message: result.message, ...result } as any);
    return invalid;
  }
}

export interface SuperRefineCtx {
  addIssue: (issue: { code?: string; message?: string; path?: (string | number)[] } & Record<string, unknown>) => void;
}

export class SuperRefineSchema<TOutput, TInput> extends Schema<TOutput, TInput> {
  constructor(
    private readonly inner: Schema<TOutput, TInput>,
    private readonly check: (value: TOutput, ctx: SuperRefineCtx) => void | Promise<void>
  ) { super(); }
  _parse(input: unknown, ctx: ParseContext): InternalResult<TOutput> {
    const parsed = this.inner._parseWithContext(input, ctx);
    if (!parsed.ok) return invalid;
    const subCtx: SuperRefineCtx = {
      addIssue: (i) => ctx.addIssue({ code: "custom", ...i } as any),
    };
    try { this.check(parsed.value, subCtx); }
    catch { ctx.addIssue({ code: "custom", message: "Refinement error" }); return invalid; }
    return ctx.issues.length === 0 || !parsed.ok ? parsed : invalid;
  }
  protected async _parseAsyncInner(input: unknown, ctx: ParseContext): Promise<InternalResult<TOutput>> {
    const parsed = await this.inner._parseAsync(input, ctx, new Set());
    if (!parsed.ok) return invalid;
    const subCtx: SuperRefineCtx = {
      addIssue: (i) => ctx.addIssue({ code: "custom", ...i } as any),
    };
    try { await this.check(parsed.value, subCtx); }
    catch { ctx.addIssue({ code: "custom", message: "Refinement error" }); return invalid; }
    return parsed;
  }
}

export class UnionSchema<T extends Schema<any, any>[]> extends Schema<
  { [K in keyof T]: T[K] extends Schema<infer O, any> ? O : never }[number]
> {
  constructor(private readonly schemas: T) { super(); }
  _parse(input: unknown, ctx: ParseContext): InternalResult<any> {
    for (const schema of this.schemas) {
      const child = ctx.fork();
      const result = schema._parseWithContext(input, child);
      if (result.ok && child.issues.length === 0) return result;
    }
    ctx.addIssue({ code: "invalid_union" }); return invalid;
  }
}

export class IntersectionSchema<A extends Schema<any, any>, B extends Schema<any, any>>
  extends Schema<A["_output"] & B["_output"]> {
  constructor(private readonly left: A, private readonly right: B) { super(); }
  _parse(input: unknown, ctx: ParseContext): InternalResult<A["_output"] & B["_output"]> {
    const left = this.left._parseWithContext(input, ctx);
    if (!left.ok) return invalid;
    const right = this.right._parseWithContext(left.value, ctx);
    if (!right.ok) return invalid;
    return ok({ ...left.value, ...right.value } as A["_output"] & B["_output"]);
  }
}

export class ValdixError extends Error {
  constructor(readonly issues: ValdixIssue[]) {
    super(issues[0]?.message ?? "Validation error");
    this.name = "ValdixError";
  }
}

// ── JSON Schema generator ──
export const jsonSchemaOf = (schema: Schema<any, any>): unknown => {
  if (typeof (schema as any)._toJSONSchema === "function") {
    return (schema as any)._toJSONSchema();
  }
  return {};
};
