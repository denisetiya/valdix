import { invalid, ok } from "../core/context.js";
import type { ParseContext, InternalResult } from "../core/context.js";
import { Schema } from "../core/schema.js";
import { typeOf } from "../core/utils.js";

type ArrayRule =
  | { kind: "min"; value: number; message?: string }
  | { kind: "max"; value: number; message?: string }
  | { kind: "length"; value: number; message?: string }
  | { kind: "unique" };

export class ArraySchema<T extends Schema<any, any>>
  extends Schema<T["_output"][]> {
  private readonly rules: ArrayRule[] = [];
  private _min?: number;
  private _max?: number;
  private _unique = false;

  constructor(private readonly item: T) { super(); }

  min(n: number, message?: string): ArraySchema<T> {
    this.rules.push({ kind: "min", value: n, message });
    this._min = n;
    return this;
  }
  max(n: number, message?: string): ArraySchema<T> {
    this.rules.push({ kind: "max", value: n, message });
    this._max = n;
    return this;
  }
  length(n: number, message?: string): ArraySchema<T> {
    this.rules.push({ kind: "length", value: n, message });
    this._min = n; this._max = n;
    return this;
  }
  nonempty(message?: string): ArraySchema<T> { return this.min(1, message); }
  unique(): ArraySchema<T> {
    this.rules.push({ kind: "unique" });
    this._unique = true;
    return this;
  }

  _toJSONSchema(): unknown {
    const inner = (this.item as any)._toJSONSchema ? (this.item as any)._toJSONSchema() : {};
    const base: any = { type: "array", items: inner, ...(this.description ? { description: this.description } : {}) };
    if (this._min !== undefined) base.minItems = this._min;
    if (this._max !== undefined) base.maxItems = this._max;
    if (this._unique) base.uniqueItems = true;
    return base;
  }

  _parse(input: unknown, ctx: ParseContext): InternalResult<T["_output"][]> {
    if (!Array.isArray(input)) {
      ctx.addIssue({ code: "invalid_type", expected: "array", received: typeOf(input) });
      return invalid;
    }
    const out: unknown[] = [];
    let hasErr = false;

    for (let i = 0; i < input.length; i++) {
      const child = ctx.childContext(String(i));
      const parsed = this.item._parseWithContext(input[i], child);
      if (!parsed.ok) { hasErr = true; if (ctx.abortEarly) return invalid; continue; }
      out.push(parsed.value);
    }

    for (const rule of this.rules) {
      if (rule.kind === "min" && out.length < rule.value) {
        ctx.addIssue({ code: "too_small", kind: "array", minimum: rule.value, inclusive: true, message: rule.message });
        if (ctx.abortEarly) return invalid;
      }
      if (rule.kind === "max" && out.length > rule.value) {
        ctx.addIssue({ code: "too_big", kind: "array", maximum: rule.value, inclusive: true, message: rule.message });
        if (ctx.abortEarly) return invalid;
      }
      if (rule.kind === "length" && out.length !== rule.value) {
        ctx.addIssue({
          code: out.length < rule.value ? "too_small" : "too_big",
          kind: "array", minimum: rule.value, maximum: rule.value, exact: true, message: rule.message
        });
        if (ctx.abortEarly) return invalid;
      }
      if (rule.kind === "unique") {
        const seen = new Set<string>();
        for (let i = 0; i < out.length; i++) {
          const k = JSON.stringify(out[i]);
          if (seen.has(k)) {
            ctx.addIssue({ code: "custom", path: [String(i)], message: "Duplicate item in array" });
            if (ctx.abortEarly) return invalid;
          } else {
            seen.add(k);
          }
        }
      }
    }

    if (hasErr) return invalid;
    return ok(out as T["_output"][]);
  }
}

export class TupleSchema<T extends Schema<any, any>[]>
  extends Schema<{ [K in keyof T]: T[K] extends Schema<infer O, any> ? O : never }> {
  constructor(private readonly items: T) { super(); }
  _toJSONSchema(): unknown {
    return {
      type: "array",
      items: this.items.map((s) => (s as any)._toJSONSchema ? (s as any)._toJSONSchema() : {}),
      minItems: this.items.length,
      maxItems: this.items.length,
      ...(this.description ? { description: this.description } : {}),
    };
  }
  _parse(input: unknown, ctx: ParseContext): InternalResult<any> {
    if (!Array.isArray(input)) {
      ctx.addIssue({ code: "invalid_type", expected: "array", received: typeOf(input) });
      return invalid;
    }
    if (input.length !== this.items.length) {
      ctx.addIssue({ code: "invalid_tuple_length", minimum: this.items.length, maximum: input.length });
      return invalid;
    }
    const out: unknown[] = [];
    let hasErr = false;
    for (let i = 0; i < this.items.length; i++) {
      const child = ctx.childContext(String(i));
      const parsed = this.items[i]!._parseWithContext(input[i], child);
      if (!parsed.ok) { hasErr = true; if (ctx.abortEarly) return invalid; continue; }
      out.push(parsed.value);
    }
    if (hasErr) return invalid;
    return ok(out);
  }
}
