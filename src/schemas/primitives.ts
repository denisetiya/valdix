import { invalid, ok } from "../core/context.js";
import type { ParseContext, InternalResult } from "../core/context.js";
import { Schema } from "../core/schema.js";
import { typeOf } from "../core/utils.js";

export class BigIntSchema extends Schema<bigint> {
  _parse(input: unknown, ctx: ParseContext): InternalResult<bigint> {
    if (typeof input === "bigint") return ok(input);
    if (typeof input === "number" && Number.isInteger(input)) return ok(BigInt(input));
    ctx.addIssue({ code: "invalid_type", expected: "bigint", received: typeOf(input) });
    return invalid;
  }
}

export class DateSchema extends Schema<Date> {
  _parse(input: unknown, ctx: ParseContext): InternalResult<Date> {
    if (input instanceof Date) {
      if (Number.isNaN(input.getTime())) { ctx.addIssue({ code: "invalid_date" }); return invalid; }
      return ok(input);
    }
    if (typeof input === "string" || typeof input === "number") {
      const date = new Date(input);
      if (Number.isNaN(date.getTime())) { ctx.addIssue({ code: "invalid_date" }); return invalid; }
      return ok(date);
    }
    ctx.addIssue({ code: "invalid_date" }); return invalid;
  }
}

export class LiteralSchema<T extends string | number | boolean | null | undefined> extends Schema<T> {
  constructor(private readonly value: T) { super(); }
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
  _parse(input: unknown, ctx: ParseContext): InternalResult<T[number]> {
    if (this.options.includes(input as T[number])) return ok(input as T[number]);
    ctx.addIssue({ code: "invalid_enum_value", options: [...this.options] });
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
  _parse(input: unknown, _ctx: ParseContext): InternalResult<any> { return ok(input); }
}

export class UnknownSchema extends Schema<unknown> {
  _parse(input: unknown, _ctx: ParseContext): InternalResult<unknown> { return ok(input); }
}

export class NullSchema extends Schema<null> {
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
