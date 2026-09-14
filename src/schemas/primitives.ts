import { invalid, ok } from "../core/context.js";
import type { ParseContext, InternalResult } from "../core/context.js";
import { Schema } from "../core/schema.js";
import { typeOf } from "../core/utils.js";

type DateRule = { kind: "min"; value: Date; message?: string } | { kind: "max"; value: Date; message?: string };

export class BigIntSchema extends Schema<bigint> {
  private _min?: bigint;
  private _max?: bigint;
  constructor(private readonly rules: { kind: "min" | "max"; value: bigint; message?: string }[] = []) {
    super();
    for (const r of rules) {
      if (r.kind === "min") this._min = r.value;
      if (r.kind === "max") this._max = r.value;
    }
  }
  /** Require bigint ≥ n. */
  min(n: bigint, message?: string): BigIntSchema { return new BigIntSchema([...this.rules, { kind: "min", value: n, message }]); }
  /** Require bigint ≤ n. */
  max(n: bigint, message?: string): BigIntSchema { return new BigIntSchema([...this.rules, { kind: "max", value: n, message }]); }
  _toJSONSchema(): unknown { return { type: "integer", format: "bigint", ...(this.description ? { description: this.description } : {}) }; }
  _parse(input: unknown, ctx: ParseContext): InternalResult<bigint> {
    let value: bigint;
    if (typeof input === "bigint") value = input;
    else if (typeof input === "number" && Number.isInteger(input)) value = BigInt(input);
    else {
      ctx.addIssue({ code: "invalid_type", expected: "bigint", received: typeOf(input) });
      return invalid;
    }
    for (const rule of this.rules) {
      if (rule.kind === "min" && value < rule.value) {
        ctx.addIssue({ code: "too_small", kind: "bigint", minimum: Number(rule.value), inclusive: true, message: rule.message });
        if (ctx.abortEarly) return invalid; continue;
      }
      if (rule.kind === "max" && value > rule.value) {
        ctx.addIssue({ code: "too_big", kind: "bigint", maximum: Number(rule.value), inclusive: true, message: rule.message });
        if (ctx.abortEarly) return invalid; continue;
      }
    }
    return ok(value);
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

export interface FileConstraints {
  maxSize?: number;
  mime?: (string | RegExp)[];
}

export class FileSchema extends Schema<File> {
  constructor(private readonly constraints: FileConstraints = {}) { super(); }
  /** Require file size ≤ n bytes. */
  maxSize(n: number): FileSchema { return new FileSchema({ ...this.constraints, maxSize: n }); }
  /** Require MIME type to match one of the given strings or patterns. */
  mime(...types: (string | RegExp)[]): FileSchema {
    return new FileSchema({ ...this.constraints, mime: [...(this.constraints.mime ?? []), ...types] });
  }
  _parse(input: unknown, ctx: ParseContext): InternalResult<File> {
    const isFile = typeof File !== "undefined" && input instanceof File;
    if (!isFile) {
      ctx.addIssue({ code: "invalid_type", expected: "File", received: typeOf(input) });
      return invalid;
    }
    const f = input as File;
    if (this.constraints.maxSize !== undefined && f.size > this.constraints.maxSize) {
      ctx.addIssue({ code: "too_big", kind: "file" as any, maximum: this.constraints.maxSize, inclusive: true });
      return invalid;
    }
    if (this.constraints.mime && this.constraints.mime.length > 0) {
      const accepted = this.constraints.mime.some((m) =>
        typeof m === "string" ? f.type === m : m.test(f.type)
      );
      if (!accepted) {
        ctx.addIssue({ code: "invalid_string", validation: "mime" });
        return invalid;
      }
    }
    return ok(f);
  }
}

export class TemplateLiteralSchema extends Schema<string> {
  constructor(private readonly parts: (string | Schema<any, any>)[]) { super(); }
  _parse(input: unknown, ctx: ParseContext): InternalResult<string> {
    if (typeof input !== "string") {
      ctx.addIssue({ code: "invalid_type", expected: "string", received: typeOf(input) });
      return invalid;
    }
    let pos = 0;
    for (const part of this.parts) {
      if (typeof part === "string") {
        if (!input.startsWith(part, pos)) {
          ctx.addIssue({ code: "invalid_string", validation: "template" });
          return invalid;
        }
        pos += part.length;
      } else {
        const child = ctx.fork();
        let matched = false;
        for (let end = pos + 1; end <= input.length; end++) {
          const slice = input.slice(pos, end);
          const probe = child.fork();
          const r = part._parseWithContext(slice, probe);
          if (r.ok && probe.issues.length === 0) {
            const rest = this.parts.slice(this.parts.indexOf(part) + 1);
            const next = rest.find((p) => typeof p === "string") as string | undefined;
            if (next === undefined || input.startsWith(next, end)) {
              pos = end;
              matched = true;
              break;
            }
          }
        }
        if (!matched) {
          ctx.addIssue({ code: "invalid_string", validation: "template" });
          return invalid;
        }
      }
    }
    if (pos !== input.length) {
      ctx.addIssue({ code: "invalid_string", validation: "template" });
      return invalid;
    }
    return ok(input);
  }
}

export class CustomSchema<T> extends Schema<T> {
  constructor(private readonly check: (value: unknown) => value is T) { super(); }
  _parse(input: unknown, ctx: ParseContext): InternalResult<T> {
    try {
      if (this.check(input)) return ok(input);
    } catch {
      ctx.addIssue({ code: "custom", message: "Refinement error" });
      return invalid;
    }
    ctx.addIssue({ code: "custom" });
    return invalid;
  }
}
