import { invalid, ok } from "../core/context.js";
import type { ParseContext, InternalResult } from "../core/context.js";
import { Schema } from "../core/schema.js";
import { typeOf } from "../core/utils.js";

/**
 * Schema for function arguments and return values.
 *
 * @example
 * ```ts
 * // args / returns
 * const F = v.function()
 *   .args(v.tuple([v.string(), v.number()]))
 *   .returns(v.string());
 *
 * // Implement and validate
 * const fn = F.implement((a, b) => `${a}:${b}`);
 * fn("a", 1);            // → "a:1"
 * fn("a", "bad" as any); // throws
 *
 * // Standalone: returns a validator for the function itself
 * const validate = F.parse(myFn);
 * ```
 */
export class FunctionSchema<TArgs extends Schema<any, any> | undefined = undefined, TReturn extends Schema<any, any> | undefined = undefined>
  extends Schema<(args: any) => any> {

  private _args?: TArgs;
  private _returns?: TReturn;

  constructor() {
    super();
    this._args = undefined;
    this._returns = undefined;
  }

  /** Set the schema for the function's input arguments. */
  args<A extends Schema<any, any>>(schema: A): FunctionSchema<A, TReturn> {
    const next = new FunctionSchema<A, TReturn>();
    next._args = schema;
    next._returns = this._returns;
    return next;
  }

  /** Set the schema for the function's return value. */
  returns<R extends Schema<any, any>>(schema: R): FunctionSchema<TArgs, R> {
    const next = new FunctionSchema<TArgs, R>();
    next._args = this._args;
    next._returns = schema;
    return next;
  }

  /**
   * Wrap a function so its arguments and return value are validated.
   * Validation failures throw `ValdixError`.
   */
  implement<Args extends any[], R>(fn: (...args: Args) => R): (...args: Args) => R {
    const argsSchema = this._args;
    const retSchema = this._returns;
    return ((...args: Args) => {
      if (argsSchema) {
        const r = argsSchema.safeParse(args);
        if (!r.success) throw new Error("Invalid arguments: " + r.errors.map((e) => e.message).join("; "));
      }
      const result = fn(...args);
      if (retSchema) {
        const r = retSchema.safeParse(result);
        if (!r.success) throw new Error("Invalid return: " + r.errors.map((e) => e.message).join("; "));
      }
      return result;
    });
  }

  _toJSONSchema(): unknown {
    return { type: "function", ...(this.description ? { description: this.description } : {}) };
  }

  _parse(input: unknown, ctx: ParseContext): InternalResult<(args: any) => any> {
    if (typeof input !== "function") {
      ctx.addIssue({ code: "invalid_type", expected: "function", received: typeOf(input) });
      return invalid;
    }
    return ok(input as (args: any) => any);
  }
}

/**
 * Schema for a Promise's resolved value.
 *
 * @example
 * ```ts
 * const P = v.promise(v.string());
 * const r = await P.parseAsync(Promise.resolve("ok"));
 * // → "ok"
 * ```
 */
export class PromiseSchema<T extends Schema<any, any>> extends Schema<Promise<T["_output"]>> {
  constructor(private readonly inner: T) { super(); }
  _toJSONSchema(): unknown { return {}; }
  async _parseAsyncInner(input: unknown, ctx: ParseContext): Promise<InternalResult<Promise<T["_output"]>>> {
    if (!(input instanceof Promise)) {
      ctx.addIssue({ code: "invalid_type", expected: "promise", received: typeOf(input) });
      return invalid;
    }
    const value = await input;
    const parsed = await this.inner._parseAsync(value, ctx, new Set<object>());
    if (!parsed.ok) return invalid;
    return ok(Promise.resolve(parsed.value));
  }
  _parse(input: unknown, _ctx: ParseContext): InternalResult<Promise<T["_output"]>> {
    if (!(input instanceof Promise)) {
      return ok(Promise.resolve(input) as any);
    }
    return ok(input as Promise<T["_output"]>);
  }
}
