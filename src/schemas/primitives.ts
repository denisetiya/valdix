import { invalid, ok } from "../core/context.js";
import type { ParseContext, InternalResult } from "../core/context.js";
import { Schema } from "../core/schema.js";
import { typeOf } from "../core/utils.js";

type DateRule = { kind: "min"; value: Date; message?: string } | { kind: "max"; value: Date; message?: string };

export class BigIntSchema extends Schema<bigint> {
  _toJSONSchema(): unknown { return { type: "integer", format: "bigint", ...(this.description ? { description: this.description } : {}) }; }
  _parse(input: unknown, ctx: ParseContext): InternalResult<bigint> {
    if (typeof input === "bigint") return ok(input);
    if (typeof input === "number" && Number.isInteger(input)) return ok(BigInt(input));
    ctx.addIssue({ code: "invalid_type", expected: "bigint", received: typeOf(input) });
    return invalid;
  }
}

export class DateSchema extends Schema<Date> {
  private _min?: Date;
  private _max?: Date;
  private readonly rules: DateRule[] = [];

  constructor(rules: DateRule[] = []) {
    super();
    this.rules = rules;
    for (const r of rules) {
      if (r.kind === "min") this._min = r.value;
      if (r.kind === "max") this._max = r.value;
    }
  }

  /** Require the date to be ≥ the given date. */
  min(date: Date, message?: string): DateSchema { return new DateSchema([...this.rules, { kind: "min", value: date, message }]); }
  /** Require the date to be ≤ the given date. */
  max(date: Date, message?: string): DateSchema { return new DateSchema([...this.rules, { kind: "max", value: date, message }]); }

  _toJSONSchema(): unknown {
    const base: any = { type: "string", format: "date-time", ...(this.description ? { description: this.description } : {}) };
    if (this._min) base.minimum = this._min.toISOString();
    if (this._max) base.maximum = this._max.toISOString();
    return base;
  }

  _parse(input: unknown, ctx: ParseContext): InternalResult<Date> {
    let date: Date | undefined;
    if (input instanceof Date) {
      if (Number.isNaN(input.getTime())) { ctx.addIssue({ code: "invalid_date" }); return invalid; }
      date = input;
    } else if (typeof input === "string" || typeof input === "number") {
      const d = new Date(input);
      if (Number.isNaN(d.getTime())) { ctx.addIssue({ code: "invalid_date" }); return invalid; }
      date = d;
    } else {
      ctx.addIssue({ code: "invalid_date" }); return invalid;
    }
    for (const rule of this.rules) {
      if (rule.kind === "min" && date.getTime() < rule.value.getTime()) {
        ctx.addIssue({ code: "too_small", kind: "date", minimum: rule.value.getTime(), inclusive: true, message: rule.message });
        if (ctx.abortEarly) return invalid; continue;
      }
      if (rule.kind === "max" && date.getTime() > rule.value.getTime()) {
        ctx.addIssue({ code: "too_big", kind: "date", maximum: rule.value.getTime(), inclusive: true, message: rule.message });
        if (ctx.abortEarly) return invalid;
      }
    }
    return ok(date);
  }
}

export class LiteralSchema<T extends string | number | boolean | null | undefined> extends Schema<T> {
  constructor(private readonly value: T) { super(); }
  _toJSONSchema(): unknown {
    return { type: typeof this.value, enum: [this.value], ...(this.description ? { description: this.description } : {}) };
  }
  _parse(input: unknown, ctx: ParseContext): InternalResult<T> {
    if (input !== this.value) {
      ctx.addIssue({ code: "invalid_literal", literal: this.value, expected: typeof this.value, received: typeOf(input) });
      return invalid;
    }
    return ok(this.value);
  }
}

export class EnumSchema<T extends readonly [string, ...string[]]> extends Schema<T[number]> {
  constructor(private readonly options: T) { super(); }
  _toJSONSchema(): unknown {
    return { type: "string", enum: [...this.options], ...(this.description ? { description: this.description } : {}) };
  }
  _parse(input: unknown, ctx: ParseContext): InternalResult<T[number]> {
    if (this.options.includes(input as T[number])) return ok(input as T[number]);
    ctx.addIssue({ code: "invalid_enum_value", options: [...this.options] });
    return invalid;
  }
}

export class NativeEnumSchema<T extends Record<string, string | number>> extends Schema<T[keyof T]> {
  private readonly values: (string | number)[];
  constructor(private readonly obj: T) {
    super();
    this.values = Object.values(obj).filter((v): v is string | number => typeof v === "string" || typeof v === "number");
  }
  _toJSONSchema(): unknown {
    return { type: typeof this.values[0] === "number" ? "number" : "string", enum: this.values, ...(this.description ? { description: this.description } : {}) };
  }
  _parse(input: unknown, ctx: ParseContext): InternalResult<T[keyof T]> {
    if (typeof input === "string" || typeof input === "number") {
      if (this.values.includes(input)) return ok(input as T[keyof T]);
    }
    ctx.addIssue({ code: "invalid_enum_value", options: this.values });
    return invalid;
  }
}

export class InstanceOfSchema<T extends abstract new (...args: any[]) => any> extends Schema<InstanceType<T>> {
  constructor(private readonly cls: T) { super(); }
  _parse(input: unknown, ctx: ParseContext): InternalResult<InstanceType<T>> {
    if (input instanceof this.cls) return ok(input as InstanceType<T>);
    ctx.addIssue({ code: "invalid_type", expected: this.cls.name || "class instance", received: typeOf(input) });
    return invalid;
  }
}

export class NeverSchema extends Schema<never> {
  _parse(_input: unknown, ctx: ParseContext): InternalResult<never> {
    ctx.addIssue({ code: "invalid_type" }); return invalid;
  }
}
export class AnySchema extends Schema<any> {
  _toJSONSchema(): unknown { return {}; }
  _parse(input: unknown, _ctx: ParseContext): InternalResult<any> { return ok(input); }
}
export class UnknownSchema extends Schema<unknown> {
  _toJSONSchema(): unknown { return {}; }
  _parse(input: unknown, _ctx: ParseContext): InternalResult<unknown> { return ok(input); }
}
export class NullSchema extends Schema<null> {
  _toJSONSchema(): unknown { return { type: "null", ...(this.description ? { description: this.description } : {}) }; }
  _parse(input: unknown, ctx: ParseContext): InternalResult<null> {
    if (input !== null) { ctx.addIssue({ code: "invalid_type", expected: "null", received: typeOf(input) }); return invalid; }
    return ok(null);
  }
}
export class UndefinedSchema extends Schema<undefined> {
  _parse(input: unknown, ctx: ParseContext): InternalResult<undefined> {
    if (input !== undefined) { ctx.addIssue({ code: "invalid_type", expected: "undefined", received: typeOf(input) }); return invalid; }
    return ok(undefined);
  }
}
export class VoidSchema extends Schema<void> {
  _parse(input: unknown, ctx: ParseContext): InternalResult<void> {
    if (input !== undefined) { ctx.addIssue({ code: "invalid_type", expected: "undefined", received: typeOf(input) }); return invalid; }
    return ok(undefined);
  }
}
