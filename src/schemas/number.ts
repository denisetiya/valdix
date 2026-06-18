import { invalid, ok } from "../core/context.js";
import type { ParseContext, InternalResult } from "../core/context.js";
import { Schema } from "../core/schema.js";
import { typeOf } from "../core/utils.js";

type NumberRule =
  | { kind: "min"; value: number }
  | { kind: "max"; value: number }
  | { kind: "int" }
  | { kind: "positive" }
  | { kind: "nonnegative" }
  | { kind: "negative" }
  | { kind: "nonpositive" }
  | { kind: "finite" }
  | { kind: "multipleOf"; value: number };

export class NumberSchema extends Schema<number> {
  constructor(private readonly rules: NumberRule[] = []) { super(); }
  private with(rule: NumberRule): NumberSchema { return new NumberSchema([...this.rules, rule]); }

  min(n: number): NumberSchema { return this.with({ kind: "min", value: n }); }
  max(n: number): NumberSchema { return this.with({ kind: "max", value: n }); }
  int(): NumberSchema { return this.with({ kind: "int" }); }
  positive(): NumberSchema { return this.with({ kind: "positive" }); }
  nonnegative(): NumberSchema { return this.with({ kind: "nonnegative" }); }
  negative(): NumberSchema { return this.with({ kind: "negative" }); }
  nonpositive(): NumberSchema { return this.with({ kind: "nonpositive" }); }
  finite(): NumberSchema { return this.with({ kind: "finite" }); }
  multipleOf(n: number): NumberSchema { return this.with({ kind: "multipleOf", value: n }); }

  _parse(input: unknown, ctx: ParseContext): InternalResult<number> {
    if (typeof input !== "number" || Number.isNaN(input)) {
      ctx.addIssue({ code: "invalid_type", expected: "number", received: typeOf(input) });
      return invalid;
    }
    for (const rule of this.rules) {
      if (rule.kind === "min" && input < rule.value) {
        ctx.addIssue({ code: "too_small", kind: "number", minimum: rule.value, inclusive: true });
        if (ctx.abortEarly) return invalid; continue;
      }
      if (rule.kind === "max" && input > rule.value) {
        ctx.addIssue({ code: "too_big", kind: "number", maximum: rule.value, inclusive: true });
        if (ctx.abortEarly) return invalid; continue;
      }
      if (rule.kind === "int" && !Number.isInteger(input)) {
        ctx.addIssue({ code: "invalid_number", validation: "integer" });
        if (ctx.abortEarly) return invalid; continue;
      }
      if (rule.kind === "positive" && input <= 0) {
        ctx.addIssue({ code: "too_small", kind: "number", minimum: 0, inclusive: false });
        if (ctx.abortEarly) return invalid; continue;
      }
      if (rule.kind === "nonnegative" && input < 0) {
        ctx.addIssue({ code: "too_small", kind: "number", minimum: 0, inclusive: true });
        if (ctx.abortEarly) return invalid; continue;
      }
      if (rule.kind === "negative" && input >= 0) {
        ctx.addIssue({ code: "too_big", kind: "number", maximum: 0, inclusive: false });
        if (ctx.abortEarly) return invalid; continue;
      }
      if (rule.kind === "nonpositive" && input > 0) {
        ctx.addIssue({ code: "too_big", kind: "number", maximum: 0, inclusive: true });
        if (ctx.abortEarly) return invalid; continue;
      }
      if (rule.kind === "finite" && !Number.isFinite(input)) {
        ctx.addIssue({ code: "invalid_number", validation: "finite" });
        if (ctx.abortEarly) return invalid; continue;
      }
      if (rule.kind === "multipleOf" && input % rule.value !== 0) {
        ctx.addIssue({ code: "invalid_number", validation: "multiple" });
        if (ctx.abortEarly) return invalid; continue;
      }
    }
    return ok(input);
  }
}

export class BooleanSchema extends Schema<boolean> {
  _parse(input: unknown, ctx: ParseContext): InternalResult<boolean> {
    if (typeof input !== "boolean") {
      ctx.addIssue({ code: "invalid_type", expected: "boolean", received: typeOf(input) });
      return invalid;
    }
    return ok(input);
  }
}
