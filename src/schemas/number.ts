import { invalid, ok } from "../core/context.js";
import type { ParseContext, InternalResult } from "../core/context.js";
import { Schema } from "../core/schema.js";
import { typeOf } from "../core/utils.js";

type NumberRule =
  | { kind: "min"; value: number; message?: string }
  | { kind: "max"; value: number; message?: string }
  | { kind: "lt"; value: number; message?: string }
  | { kind: "gt"; value: number; message?: string }
  | { kind: "int" }
  | { kind: "positive" }
  | { kind: "nonnegative" }
  | { kind: "negative" }
  | { kind: "nonpositive" }
  | { kind: "finite" }
  | { kind: "safe" }
  | { kind: "multipleOf"; value: number };

export class NumberSchema extends Schema<number> {
  private readonly rules: NumberRule[];
  private _min?: number;
  private _max?: number;
  private _exclusiveMin?: number;
  private _exclusiveMax?: number;
  private _intOnly = false;

  constructor(rules: NumberRule[] = []) {
    super();
    this.rules = rules;
    for (const r of rules) {
      if (r.kind === "min") this._min = r.value;
      if (r.kind === "max") this._max = r.value;
      if (r.kind === "gt") this._exclusiveMin = r.value;
      if (r.kind === "lt") this._exclusiveMax = r.value;
      if (r.kind === "int") this._intOnly = true;
    }
  }
  private with(rule: NumberRule): NumberSchema { return new NumberSchema([...this.rules, rule]); }

  /** Require number ≥ n (inclusive). */
  min(n: number, message?: string): NumberSchema { return this.with({ kind: "min", value: n, message }); }
  /** Require number ≤ n (inclusive). */
  max(n: number, message?: string): NumberSchema { return this.with({ kind: "max", value: n, message }); }
  /** Require number < n (exclusive). */
  lt(n: number, message?: string): NumberSchema { return this.with({ kind: "lt", value: n, message }); }
  /** Require number > n (exclusive). */
  gt(n: number, message?: string): NumberSchema { return this.with({ kind: "gt", value: n, message }); }
  /** Require an integer. */
  int(): NumberSchema { return this.with({ kind: "int" }); }
  /** Require number > 0. */
  positive(): NumberSchema { return this.with({ kind: "positive" }); }
  /** Require number ≥ 0. */
  nonnegative(): NumberSchema { return this.with({ kind: "nonnegative" }); }
  /** Require number < 0. */
  negative(): NumberSchema { return this.with({ kind: "negative" }); }
  /** Require number ≤ 0. */
  nonpositive(): NumberSchema { return this.with({ kind: "nonpositive" }); }
  /** Reject `Infinity` and `NaN`. */
  finite(): NumberSchema { return this.with({ kind: "finite" }); }
  /** Restrict to `Number.MIN_SAFE_INTEGER` … `MAX_SAFE_INTEGER`. */
  safe(): NumberSchema { return this.with({ kind: "safe" }); }
  /** Require number to be a multiple of n. */
  multipleOf(n: number): NumberSchema { return this.with({ kind: "multipleOf", value: n }); }

  _toJSONSchema(): unknown {
    const base: any = { type: "number", ...(this.description ? { description: this.description } : {}) };
    if (this._min !== undefined) base.minimum = this._min;
    if (this._max !== undefined) base.maximum = this._max;
    if (this._exclusiveMin !== undefined) { base.exclusiveMinimum = this._exclusiveMin; delete base.minimum; }
    if (this._exclusiveMax !== undefined) { base.exclusiveMaximum = this._exclusiveMax; delete base.maximum; }
    if (this._intOnly) base.type = "integer";
    return base;
  }

  _parse(input: unknown, ctx: ParseContext): InternalResult<number> {
    if (typeof input !== "number" || Number.isNaN(input)) {
      ctx.addIssue({ code: "invalid_type", expected: "number", received: typeOf(input) });
      return invalid;
    }
    for (const rule of this.rules) {
      if (rule.kind === "min" && input < rule.value) {
        ctx.addIssue({ code: "too_small", kind: "number", minimum: rule.value, inclusive: true, message: rule.message });
        if (ctx.abortEarly) return invalid; continue;
      }
      if (rule.kind === "max" && input > rule.value) {
        ctx.addIssue({ code: "too_big", kind: "number", maximum: rule.value, inclusive: true, message: rule.message });
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
      if (rule.kind === "safe" && (input < Number.MIN_SAFE_INTEGER || input > Number.MAX_SAFE_INTEGER)) {
        ctx.addIssue({ code: "invalid_number", validation: "safe" });
        if (ctx.abortEarly) return invalid; continue;
      }
      if (rule.kind === "gt" && input <= rule.value) {
        ctx.addIssue({ code: "too_small", kind: "number", minimum: rule.value, inclusive: false, message: rule.message });
        if (ctx.abortEarly) return invalid; continue;
      }
      if (rule.kind === "lt" && input >= rule.value) {
        ctx.addIssue({ code: "too_big", kind: "number", maximum: rule.value, inclusive: false, message: rule.message });
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
  _toJSONSchema(): unknown { return { type: "boolean", ...(this.description ? { description: this.description } : {}) }; }
  _parse(input: unknown, ctx: ParseContext): InternalResult<boolean> {
    if (typeof input !== "boolean") {
      ctx.addIssue({ code: "invalid_type", expected: "boolean", received: typeOf(input) });
      return invalid;
    }
    return ok(input);
  }
}
