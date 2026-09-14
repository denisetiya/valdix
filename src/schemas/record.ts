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

  private _min?: number;
  private _max?: number;
  private _minMsg?: string;
  private _maxMsg?: string;

  /** Require at least n entries. */
  min(n: number, message?: string): this {
    this._min = n;
    this._minMsg = message;
    return this;
  }
  /** Require at most n entries. */
  max(n: number, message?: string): this {
    this._max = n;
    this._maxMsg = message;
    return this;
  }
  /** Shorthand for `.min(1)`. */
  nonempty(message?: string): this { return this.min(1, message); }

  _toJSONSchema(): unknown {
    const inner = (this.valueSchema as any)._toJSONSchema ? (this.valueSchema as any)._toJSONSchema() : {};
    const base: any = { type: "object", additionalProperties: inner, ...(this.description ? { description: this.description } : {}) };
    if (this._min !== undefined) base.minProperties = this._min;
    if (this._max !== undefined) base.maxProperties = this._max;
    return base;
  }

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
      if (!keyResult.ok) {
        hasErr = true;
        if (ctx.abortEarly) return invalid;
        continue;
      }
      ctx.pathStack.push(keyResult.value);
      const valueResult = this.valueSchema._parseWithContext(source[key], ctx);
      ctx.pathStack.length = pathLen;
      if (!valueResult.ok) { hasErr = true; if (ctx.abortEarly) return invalid; continue; }
      out[keyResult.value] = valueResult.value;
    }

    if (this._min !== undefined && keys.length < this._min) {
      ctx.addIssue({ code: "too_small", kind: "record" as any, minimum: this._min, inclusive: true, message: this._minMsg });
      return invalid;
    }
    if (this._max !== undefined && keys.length > this._max) {
      ctx.addIssue({ code: "too_big", kind: "record" as any, maximum: this._max, inclusive: true, message: this._maxMsg });
      return invalid;
    }

    if (hasErr) return invalid;
    return ok(out as Record<string, TValue["_output"]>);
  }
}
