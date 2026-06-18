import { invalid, ok } from "../core/context.js";
import type { ParseContext, InternalResult } from "../core/context.js";
import { Schema, OptionalSchema } from "../core/schema.js";
import { typeOf, isPlainObject, hasOwn } from "../core/utils.js";
import { EnumSchema } from "./primitives.js";
import { UnionSchema } from "../core/schema.js";

export type ObjectShape = Record<string, Schema<any, any>>;

type Simplify<T> = { [K in keyof T]: T[K] } & {};

type ObjectInput<T extends ObjectShape> = Simplify<{
  [K in keyof T]: undefined extends T[K]["_input"] ? T[K]["_input"] | undefined : T[K]["_input"];
}>;

type ObjectOutput<T extends ObjectShape> = Simplify<{
  [K in keyof T]: T[K] extends Schema<infer O, any> ? O : never;
}>;

export class ObjectSchema<T extends ObjectShape>
  extends Schema<ObjectOutput<T>, ObjectInput<T>> {
  private readonly _catchall?: Schema<any, any>;

  constructor(
    readonly shape: T,
    private readonly policy: "strip" | "passthrough" | "strict" = "strip",
    catchall?: Schema<any, any>
  ) {
    super();
    this._catchall = catchall;
  }

  strict(): ObjectSchema<T> { return new ObjectSchema(this.shape, "strict", this._catchall); }
  passthrough(): ObjectSchema<T> { return new ObjectSchema(this.shape, "passthrough", this._catchall); }
  strip(): ObjectSchema<T> { return new ObjectSchema(this.shape, "strip", this._catchall); }
  catchall(s: Schema<any, any>): ObjectSchema<T> { return new ObjectSchema(this.shape, "passthrough", s); }

  extend<U extends ObjectShape>(shape: U): ObjectSchema<T & U> {
    return new ObjectSchema({ ...this.shape, ...shape } as T & U, this.policy, this._catchall);
  }
  merge<U extends ObjectShape>(other: ObjectSchema<U>): ObjectSchema<T & U> {
    return new ObjectSchema({ ...this.shape, ...other.shape } as T & U, this.policy, this._catchall);
  }
  pick<K extends keyof T>(keys: K[]): ObjectSchema<Pick<T, K>> {
    const picked = {} as Pick<T, K>;
    for (const k of keys) picked[k] = this.shape[k]! as T[K];
    return new ObjectSchema(picked as any, this.policy, this._catchall);
  }
  omit<K extends keyof T>(keys: K[]): ObjectSchema<Omit<T, K>> {
    const omitted = { ...this.shape } as any;
    for (const k of keys) delete omitted[String(k)];
    return new ObjectSchema(omitted, this.policy, this._catchall);
  }
  partial(): ObjectSchema<{ [K in keyof T]: OptionalSchema<T[K]> }> {
    const shape = {} as any;
    for (const key of Object.keys(this.shape)) shape[key] = this.shape[key]!.optional();
    return new ObjectSchema(shape, this.policy, this._catchall);
  }
  required(): ObjectSchema<RequiredShape<T>>;
  required<K extends keyof T>(keys: K[]): ObjectSchema<RequiredShapeByKeys<T, K>>;
  required(keys?: any[]): ObjectSchema<any> {
    const shape = {} as any;
    const targetKeys = keys ? new Set(keys.map(String)) : null;
    for (const [key, s] of Object.entries(this.shape)) {
      shape[key] = targetKeys && !targetKeys.has(key)
        ? s
        : s instanceof OptionalSchema ? (s as any).inner : s;
    }
    return new ObjectSchema(shape, this.policy, this._catchall);
  }

  keyof(): EnumSchema<[Extract<keyof T, string>, ...Extract<keyof T, string>[]]> {
    const keys = Object.keys(this.shape) as Extract<keyof T, string>[];
    if (keys.length === 0) throw new Error("Cannot build keyof() from empty shape");
    return new EnumSchema(keys as any);
  }

  _toJSONSchema(): unknown {
    const properties: Record<string, unknown> = {};
    const required: string[] = [];
    for (const [k, s] of Object.entries(this.shape)) {
      properties[k] = (s as any)._toJSONSchema ? (s as any)._toJSONSchema() : {};
      if (!(s instanceof OptionalSchema) && !(s as any)._inputOptional) required.push(k);
    }
    const base: any = { type: "object", properties, ...(this.description ? { description: this.description } : {}) };
    if (required.length > 0) base.required = required;
    if (this._catchall) base.additionalProperties = (this._catchall as any)._toJSONSchema ? (this._catchall as any)._toJSONSchema() : true;
    else if (this.policy === "passthrough") base.additionalProperties = true;
    else if (this.policy === "strict") base.additionalProperties = false;
    return base;
  }

  _parse(input: unknown, ctx: ParseContext): InternalResult<ObjectOutput<T>> {
    if (!isPlainObject(input)) {
      ctx.addIssue({ code: "invalid_type", expected: "object", received: typeOf(input) });
      return invalid;
    }
    const source = input as Record<string, unknown>;
    const output: Record<string, unknown> = {};
    let hasErr = false;

    for (const key of Object.keys(this.shape)) {
      const schema = this.shape[key]! as Schema;
      if (!hasOwn(source, key)) {
        const probe = ctx.fork();
        const fallback = schema._parseWithContext(undefined, probe);
        if (fallback.ok && probe.issues.length === 0) {
          if (typeof fallback.value !== "undefined") output[key] = fallback.value;
          continue;
        }
        const child = ctx.childContext(key);
        child.addIssue({ code: "required" });
        hasErr = true;
        if (ctx.abortEarly) return invalid;
        continue;
      }
      const child = ctx.childContext(key);
      const parsed = schema._parseWithContext(source[key], child);
      if (!parsed.ok) { hasErr = true; if (ctx.abortEarly) return invalid; continue; }
      if (typeof parsed.value !== "undefined") output[key] = parsed.value;
    }

    const srcKeys = Object.keys(source);
    const unknown = srcKeys.filter((k) => !hasOwn(this.shape, k));
    if (this._catchall) {
      for (const k of unknown) {
        const child = ctx.childContext(k);
        const parsed = (this._catchall as any)._parseWithContext(source[k], child);
        if (parsed.ok) output[k] = parsed.value;
        else { hasErr = true; if (ctx.abortEarly) return invalid; }
      }
    } else if (this.policy === "strict" && unknown.length > 0) {
      ctx.addIssue({ code: "unknown_keys", keys: unknown });
      hasErr = true;
    } else if (this.policy === "passthrough") {
      for (const k of unknown) output[k] = source[k];
    }

    if (hasErr) return invalid;
    return ok(output as ObjectOutput<T>);
  }
}

type RequiredShape<T extends ObjectShape> = {
  [K in keyof T]: T[K] extends OptionalSchema<infer U> ? U : T[K];
};
type RequiredShapeByKeys<T extends ObjectShape, K extends keyof T> = {
  [P in keyof T]: P extends K ? (T[P] extends OptionalSchema<infer U> ? U : T[P]) : T[P];
};
