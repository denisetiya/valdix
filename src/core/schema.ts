import type { ParseOptions, SafeParseResult, ValdixIssue } from "./types.js";
import { createParseContext, ok, invalid, type InternalResult, type ParseContext } from "./context.js";
import type { LocaleCatalog } from "./types.js";

let defaultLang = "en";
const localeRegistry = new Map<string, LocaleCatalog>();

export const useLang = (lang: string): void => {
  defaultLang = lang;
};

export const registerLocale = (lang: string, catalog: LocaleCatalog): void => {
  localeRegistry.set(lang, catalog);
};

export const getLocales = (): Map<string, LocaleCatalog> => localeRegistry;

export type Infer<T extends Schema<any, any>> = T extends Schema<infer O, any> ? O : never;
export type Input<T extends Schema<any, any>> = T extends Schema<any, infer I> ? I : never;

export abstract class Schema<TOutput = unknown, TInput = TOutput> {
  readonly _output!: TOutput;
  readonly _input!: TInput;

  abstract _parse(input: unknown, ctx: ParseContext): InternalResult<TOutput>;

  parse(input: unknown, options?: ParseOptions): TOutput {
    const ctx = createParseContext(options, localeRegistry, defaultLang);
    const result = this._parse(input, ctx);
    if (!result.ok || ctx.issues.length > 0) {
      throw new ValdixError(ctx.issues);
    }
    return result.value;
  }

  safeParse(input: unknown, options?: ParseOptions): SafeParseResult<TOutput> {
    const ctx = createParseContext(options, localeRegistry, defaultLang);
    const result = this._parse(input, ctx);
    if (result.ok && ctx.issues.length === 0) {
      return { success: true, data: result.value };
    }
    return { success: false, errors: ctx.issues };
  }

  optional(): OptionalSchema<Schema<TOutput, TInput>> {
    return new OptionalSchema(this as unknown as Schema<TOutput, TInput>);
  }

  nullable(): NullableSchema<Schema<TOutput, TInput>> {
    return new NullableSchema(this as unknown as Schema<TOutput, TInput>);
  }

  nullish(): OptionalSchema<NullableSchema<Schema<TOutput, TInput>>> {
    return new OptionalSchema(new NullableSchema(this as unknown as Schema<TOutput, TInput>));
  }

  default(value: TOutput | (() => TOutput)): DefaultSchema<TOutput, TInput> {
    return new DefaultSchema(this as unknown as Schema<TOutput, TInput>, value);
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
}

export class OptionalSchema<T extends Schema<any, any>> extends Schema<
  T["_output"] | undefined,
  T["_input"] | undefined
> {
  constructor(readonly inner: T) { super(); }
  _parse(input: unknown, ctx: ParseContext): InternalResult<T["_output"] | undefined> {
    if (input === undefined) return ok(undefined);
    return this.inner._parse(input, ctx);
  }
}

export class NullableSchema<T extends Schema<any, any>> extends Schema<
  T["_output"] | null,
  T["_input"] | null
> {
  constructor(readonly inner: T) { super(); }
  _parse(input: unknown, ctx: ParseContext): InternalResult<T["_output"] | null> {
    if (input === null) return ok(null);
    return this.inner._parse(input, ctx);
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
    return this.inner._parse(value, ctx);
  }
}

export class TransformSchema<TOutput, TInput, TNext> extends Schema<TNext, TInput> {
  constructor(
    readonly inner: Schema<TOutput, TInput>,
    private readonly fn: (value: TOutput) => TNext
  ) { super(); }
  _parse(input: unknown, ctx: ParseContext): InternalResult<TNext> {
    const parsed = this.inner._parse(input, ctx);
    if (!parsed.ok) return invalid;
    try {
      return ok(this.fn(parsed.value));
    } catch {
      ctx.addIssue({ code: "custom", message: "Transform failed" });
      return invalid;
    }
  }
}

export class PipeSchema<TOutput, TInput, TNext> extends Schema<TNext, TInput> {
  constructor(
    private readonly first: Schema<TOutput, TInput>,
    private readonly second: Schema<TNext, TOutput>
  ) { super(); }
  _parse(input: unknown, ctx: ParseContext): InternalResult<TNext> {
    const firstResult = this.first._parse(input, ctx);
    if (!firstResult.ok) return invalid;
    return this.second._parse(firstResult.value, ctx);
  }
}

export class UnionSchema<T extends Schema<any, any>[]> extends Schema<
  { [K in keyof T]: T[K] extends Schema<infer O, any> ? O : never }[number]
> {
  constructor(private readonly schemas: T) { super(); }
  _parse(input: unknown, ctx: ParseContext): InternalResult<any> {
    for (const schema of this.schemas) {
      const child = ctx.fork();
      const result = schema._parse(input, child);
      if (result.ok && child.issues.length === 0) return result;
    }
    ctx.addIssue({ code: "invalid_union" });
    return invalid;
  }
}

export class IntersectionSchema<A extends Schema<any, any>, B extends Schema<any, any>>
  extends Schema<A["_output"] & B["_output"]> {
  constructor(
    private readonly left: A,
    private readonly right: B
  ) { super(); }
  _parse(input: unknown, ctx: ParseContext): InternalResult<A["_output"] & B["_output"]> {
    const leftResult = this.left._parse(input, ctx);
    if (!leftResult.ok) return invalid;
    const rightResult = this.right._parse(leftResult.value, ctx);
    if (!rightResult.ok) return invalid;
    return ok({ ...leftResult.value, ...rightResult.value } as A["_output"] & B["_output"]);
  }
}

export class ValdixError extends Error {
  constructor(readonly issues: ValdixIssue[]) {
    super(issues[0]?.message ?? "Validation error");
    this.name = "ValdixError";
  }
}
