import { invalid, ok } from "../core/context.js";
import type { ParseContext, InternalResult } from "../core/context.js";
import { Schema } from "../core/schema.js";
import { typeOf, isPlainObject, hasOwn } from "../core/utils.js";

export class RecordSchema<TKey extends Schema<string>, TValue extends Schema<any, any>>
  extends Schema<Record<string, TValue["_output"]>> {
  constructor(
    private readonly keySchema: TKey,
    private readonly valueSchema: TValue
  ) { super(); }

  _parse(input: unknown, ctx: ParseContext): InternalResult<Record<string, TValue["_output"]>> {
    if (!isPlainObject(input)) {
      ctx.addIssue({ code: "invalid_type", expected: "object", received: typeOf(input) });
      return invalid;
    }
    const source = input as Record<string, unknown>;
    const out: Record<string, unknown> = {};
    let hasErr = false;

    for (const key of Object.keys(source)) {
      const keyCtx = ctx.childContext(key);
      const keyResult = this.keySchema._parse(key, keyCtx);
      if (!keyResult.ok) { hasErr = true; if (ctx.abortEarly) return invalid; continue; }
      const valueCtx = ctx.childContext(key);
      const valueResult = this.valueSchema._parse(source[key], valueCtx);
      if (!valueResult.ok) { hasErr = true; if (ctx.abortEarly) return invalid; continue; }
      out[key] = valueResult.value;
    }

    if (hasErr) return invalid;
    return ok(out as Record<string, TValue["_output"]>);
  }
}
