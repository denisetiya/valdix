import { invalid, ok } from "../core/context.js";
import type { ParseContext, InternalResult } from "../core/context.js";
import { Schema } from "../core/schema.js";
import { typeOf, isPlainObject } from "../core/utils.js";

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
    const pathLen = ctx.pathStack.length;
    const keys = Object.keys(source);

    for (let i = 0; i < keys.length; i++) {
      const key = keys[i]!;
      const keyResult = this.keySchema._parse(key, ctx);
      if (!keyResult.ok) { hasErr = true; if (ctx.abortEarly) return invalid; continue; }
      ctx.pathStack.push(key);
      const valueResult = this.valueSchema._parseWithContext(source[key], ctx);
      ctx.pathStack.length = pathLen;
      if (!valueResult.ok) { hasErr = true; if (ctx.abortEarly) return invalid; continue; }
      out[key] = valueResult.value;
    }

    if (hasErr) return invalid;
    return ok(out as Record<string, TValue["_output"]>);
  }
}
