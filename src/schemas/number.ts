import { invalid, ok } from "../core/context.js";
import type { ParseContext, InternalResult } from "../core/context.js";
import { Schema } from "../core/schema.js";
import { typeOf } from "../core/utils.js";

type NumberRule =
  | { kind: "min"; value: number; message?: string }
  | { kind: "max"; value: number; message?: string }
  | { kind: "lt"; value: number; message?: string }
  | { kind: "gt"; value: number; message?: string }
  | { kind: "int"; message?: string }
  | { kind: "positive"; message?: string }
  | { kind: "nonnegative"; message?: string }
  | { kind: "negative"; message?: string }
  | { kind: "nonpositive"; message?: string }
  | { kind: "finite"; message?: string }
  | { kind: "safe"; message?: string }
  | { kind: "nan"; message?: string }
  | { kind: "multipleOf"; value: number; message?: string }
  | { kind: "step"; value: number; message?: string };

export class NumberSchema extends Schema<number> {
  private readonly rules: NumberRule[];
  private _min?: number;
  private _max?: number;
  private _exclusiveMin?: number;
  private _exclusiveMax?: number;
  private _minMsg?: string;
  private _maxMsg?: string;
  private _gtMsg?: string;
  private _ltMsg?: string;
  private _intOnly = false;
  private _intMsg?: string;
  private _allowNaN = false;

  constructor(rules: NumberRule[] = []) {
    super();
    this.rules = rules;
    for (const r of rules) {
      if (r.kind === "min") { this._min = r.value; this._minMsg = r.message; }
      if (r.kind === "max") { this._max = r.value; this._maxMsg = r.message; }
      if (r.kind === "gt") { this._exclusiveMin = r.value; this._gtMsg = r.message; }
      if (r.kind === "lt") { this._exclusiveMax = r.value; this._ltMsg = r.message; }
      if (r.kind === "int") { this._intOnly = true; this._intMsg = r.message; }
      if (r.kind === "nan") this._allowNaN = true;
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
  int(message?: string): NumberSchema { return this.with({ kind: "int", message }); }
  /** Require number > 0. */
  positive(message?: string): NumberSchema { return this.with({ kind: "positive", message }); }
  /** Require number ≥ 0. */
  nonnegative(message?: string): NumberSchema { return this.with({ kind: "nonnegative", message }); }
  /** Require number < 0. */
  negative(message?: string): NumberSchema { return this.with({ kind: "negative", message }); }
  /** Require number ≤ 0. */
  nonpositive(message?: string): NumberSchema { return this.with({ kind: "nonpositive", message }); }
  /** Reject `Infinity` and `NaN`. */
  finite(message?: string): NumberSchema { return this.with({ kind: "finite", message }); }
  /** Restrict to `Number.MIN_SAFE_INTEGER` … `MAX_SAFE_INTEGER`. */
  safe(message?: string): NumberSchema { return this.with({ kind: "safe", message }); }
  /** Require `NaN` (useful for sanitized numeric input). */
  nan(message?: string): NumberSchema { return this.with({ kind: "nan", message }); }
  /** Require number to be a multiple of n. */
  multipleOf(n: number, message?: string): NumberSchema { return this.with({ kind: "multipleOf", value: n, message }); }
  /** Require number to step from 0 by n (alias of multipleOf). */
  step(n: number, message?: string): NumberSchema { return this.with({ kind: "step", value: n, message }); }

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
    if (typeof input !== "number" || (!this._allowNaN && Number.isNaN(input))) {
      ctx.addIssue({ code: "invalid_type", expected: "number", received: typeOf(input) });
      return invalid;
    }
    if (this._allowNaN) {
      const nanRule = this.rules.find((r) => r.kind === "nan");
      if (Number.isNaN(input)) return ok(input);
      ctx.addIssue({ code: "invalid_number", validation: "nan", message: nanRule?.message });
      return invalid;
    }
    // Fast path: direct field checks. Avoids the per-rule object property access
    // and lets V8 inline the common cases (int+min, min+max, etc.).
    if (this._min !== undefined && input < this._min) {
      ctx.addIssue({ code: "too_small", kind: "number", minimum: this._min, inclusive: true, message: this._minMsg });
      return invalid;
    }
    if (this._max !== undefined && input > this._max) {
      ctx.addIssue({ code: "too_big", kind: "number", maximum: this._max, inclusive: true, message: this._maxMsg });
      return invalid;
    }
    if (this._exclusiveMin !== undefined && input <= this._exclusiveMin) {
      ctx.addIssue({ code: "too_small", kind: "number", minimum: this._exclusiveMin, inclusive: false, message: this._gtMsg });
      return invalid;
    }
    if (this._exclusiveMax !== undefined && input >= this._exclusiveMax) {
      ctx.addIssue({ code: "too_big", kind: "number", maximum: this._exclusiveMax, inclusive: false, message: this._ltMsg });
      return invalid;
    }
    if (this._intOnly && !Number.isInteger(input)) {
      ctx.addIssue({ code: "invalid_number", validation: "integer", message: this._intMsg });
      return invalid;
    }
    if (this.rules.length === 0) return ok(input);
    // Fast path above already verified min/max/gt/lt/int, so skip them here.
    const skipMin = this._min !== undefined;
    const skipMax = this._max !== undefined;
    const skipGt = this._exclusiveMin !== undefined;
    const skipLt = this._exclusiveMax !== undefined;
    const skipInt = this._intOnly;
    for (const rule of this.rules) {
      if (rule.kind === "min" && !skipMin && input < rule.value) {
        ctx.addIssue({ code: "too_small", kind: "number", minimum: rule.value, inclusive: true, message: rule.message });
        if (ctx.abortEarly) return invalid; continue;
      }
      if (rule.kind === "max" && !skipMax && input > rule.value) {
        ctx.addIssue({ code: "too_big", kind: "number", maximum: rule.value, inclusive: true, message: rule.message });
        if (ctx.abortEarly) return invalid; continue;
      }
      if (rule.kind === "int" && !skipInt && !Number.isInteger(input)) {
        ctx.addIssue({ code: "invalid_number", validation: "integer", message: rule.message });
        if (ctx.abortEarly) return invalid; continue;
      }
      if (rule.kind === "positive" && input <= 0) {
        ctx.addIssue({ code: "too_small", kind: "number", minimum: 0, inclusive: false, message: rule.message });
        if (ctx.abortEarly) return invalid; continue;
      }
      if (rule.kind === "nonnegative" && input < 0) {
        ctx.addIssue({ code: "too_small", kind: "number", minimum: 0, inclusive: true, message: rule.message });
        if (ctx.abortEarly) return invalid; continue;
      }
      if (rule.kind === "negative" && input >= 0) {
        ctx.addIssue({ code: "too_big", kind: "number", maximum: 0, inclusive: false, message: rule.message });
        if (ctx.abortEarly) return invalid; continue;
      }
      if (rule.kind === "nonpositive" && input > 0) {
        ctx.addIssue({ code: "too_big", kind: "number", maximum: 0, inclusive: true, message: rule.message });
        if (ctx.abortEarly) return invalid; continue;
      }
      if (rule.kind === "finite" && !Number.isFinite(input)) {
        ctx.addIssue({ code: "invalid_number", validation: "finite", message: rule.message });
        if (ctx.abortEarly) return invalid; continue;
      }
      if (rule.kind === "safe" && (input < Number.MIN_SAFE_INTEGER || input > Number.MAX_SAFE_INTEGER)) {
        ctx.addIssue({ code: "invalid_number", validation: "safe", message: rule.message });
        if (ctx.abortEarly) return invalid; continue;
      }
      if (rule.kind === "gt" && !skipGt && input <= rule.value) {
        ctx.addIssue({ code: "too_small", kind: "number", minimum: rule.value, inclusive: false, message: rule.message });
        if (ctx.abortEarly) return invalid; continue;
      }
      if (rule.kind === "lt" && !skipLt && input >= rule.value) {
        ctx.addIssue({ code: "too_big", kind: "number", maximum: rule.value, inclusive: false, message: rule.message });
        if (ctx.abortEarly) return invalid; continue;
      }
      if (rule.kind === "multipleOf" && input % rule.value !== 0) {
        ctx.addIssue({ code: "invalid_number", validation: "multiple", message: rule.message });
        if (ctx.abortEarly) return invalid; continue;
      }
      if (rule.kind === "step" && input % rule.value !== 0) {
        ctx.addIssue({ code: "invalid_number", validation: "step", message: rule.message });
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
