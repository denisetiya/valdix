import { invalid, ok } from "../core/context.js";
import type { ParseContext, InternalResult } from "../core/context.js";
import { Schema } from "../core/schema.js";
import { typeOf } from "../core/utils.js";

export class ArraySchema<T extends Schema<any, any>>
  extends Schema<T["_output"][]> {
  private readonly rules: ArrayRule[] = [];

  constructor(private readonly item: T) { super(); }

  min(n: number): ArraySchema<T> {
    this.rules.push({ kind: "min", value: n });
    return this;
  }
  max(n: number): ArraySchema<T> {
    this.rules.push({ kind: "max", value: n });
    return this;
  }
  length(n: number): ArraySchema<T> {
    this.rules.push({ kind: "length", value: n });
    return this;
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
      const parsed = this.item._parse(input[i], child);
      if (!parsed.ok) { hasErr = true; if (ctx.abortEarly) return invalid; continue; }
      out.push(parsed.value);
    }

    for (const rule of this.rules) {
      if (rule.kind === "min" && out.length < rule.value) {
        ctx.addIssue({ code: "too_small", kind: "array", minimum: rule.value, inclusive: true });
        if (ctx.abortEarly) return invalid;
      }
      if (rule.kind === "max" && out.length > rule.value) {
        ctx.addIssue({ code: "too_big", kind: "array", maximum: rule.value, inclusive: true });
        if (ctx.abortEarly) return invalid;
      }
      if (rule.kind === "length" && out.length !== rule.value) {
        ctx.addIssue({
          code: out.length < rule.value ? "too_small" : "too_big",
          kind: "array", minimum: rule.value, maximum: rule.value, exact: true
        });
        if (ctx.abortEarly) return invalid;
      }
    }

    if (hasErr) return invalid;
    return ok(out as T["_output"][]);
  }
}

type ArrayRule =
  | { kind: "min"; value: number }
  | { kind: "max"; value: number }
  | { kind: "length"; value: number };

export class TupleSchema<T extends Schema<any, any>[]>
  extends Schema<{ [K in keyof T]: T[K] extends Schema<infer O, any> ? O : never }> {
  constructor(private readonly items: T) { super(); }
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
      const parsed = this.items[i]!._parse(input[i], child);
      if (!parsed.ok) { hasErr = true; if (ctx.abortEarly) return invalid; continue; }
      out.push(parsed.value);
    }
    if (hasErr) return invalid;
    return ok(out);
  }
}
