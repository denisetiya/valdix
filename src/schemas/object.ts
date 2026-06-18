import { invalid, ok } from "../core/context.js";
import type { ParseContext, InternalResult } from "../core/context.js";
import { Schema, OptionalSchema } from "../core/schema.js";
import { typeOf, isPlainObject, hasOwn } from "../core/utils.js";
import { EnumSchema } from "./primitives.js";

export type ObjectShape = Record<string, Schema<any, any>>;

type Simplify<T> = { [K in keyof T]: T[K] } & {};

type ObjectInput<T extends ObjectShape> = Simplify<{
  [K in keyof T]: undefined extends T[K]["_input"] ? T[K]["_input"] | undefined : T[K]["_input"];
}>;

type ObjectOutput<T extends ObjectShape> = Simplify<{
  [K in keyof T]: T[K] extends Schema<infer O, any> ? O : never;
}>;

type UnwrapOptional<T> = T extends OptionalSchema<infer U> ? U : T;
type DeepPartial<T> = T extends ObjectSchema<infer S> ? ObjectSchema<{ [K in keyof S]: OptionalSchema<DeepPartial<S[K]>> }> : T;
type DeepRequired<T> = T extends OptionalSchema<infer U> ? DeepRequired<U> : T;

export class ObjectSchema<T extends ObjectShape>
  extends Schema<ObjectOutput<T>, ObjectInput<T>> {
  constructor(
    readonly shape: T,
    private readonly policy: "strip" | "passthrough" | "strict" = "strip"
  ) { super(); }

  strict(): ObjectSchema<T> { return new ObjectSchema(this.shape, "strict"); }
  passthrough(): ObjectSchema<T> { return new ObjectSchema(this.shape, "passthrough"); }
  strip(): ObjectSchema<T> { return new ObjectSchema(this.shape, "strip"); }

  extend<U extends ObjectShape>(shape: U): ObjectSchema<T & U> {
    return new ObjectSchema({ ...this.shape, ...shape } as T & U, this.policy);
  }
  merge<U extends ObjectShape>(other: ObjectSchema<U>): ObjectSchema<T & U> {
    return new ObjectSchema({ ...this.shape, ...other.shape } as T & U, this.policy);
  }
  pick<K extends keyof T>(keys: K[]): ObjectSchema<Pick<T, K>> {
    const picked = {} as Pick<T, K>;
    for (const k of keys) picked[k] = this.shape[k]! as T[K];
    return new ObjectSchema(picked as any, this.policy);
  }
  omit<K extends keyof T>(keys: K[]): ObjectSchema<Omit<T, K>> {
    const omitted = { ...this.shape } as any;
    for (const k of keys) delete omitted[String(k)];
    return new ObjectSchema(omitted, this.policy);
  }
  partial(): ObjectSchema<{ [K in keyof T]: OptionalSchema<T[K]> }> {
    const shape = {} as any;
    for (const key of Object.keys(this.shape)) shape[key] = this.shape[key]!.optional();
    return new ObjectSchema(shape, this.policy);
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
    return new ObjectSchema(shape, this.policy);
  }

  keyof(): EnumSchema<[Extract<keyof T, string>, ...Extract<keyof T, string>[]]> {
    const keys = Object.keys(this.shape) as Extract<keyof T, string>[];
    if (keys.length === 0) throw new Error("Cannot build keyof() from empty shape");
    return new EnumSchema(keys as any);
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
        const fallback = schema._parse(undefined, probe);
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
      const parsed = schema._parse(source[key], child);
      if (!parsed.ok) { hasErr = true; if (ctx.abortEarly) return invalid; continue; }
      if (typeof parsed.value !== "undefined") output[key] = parsed.value;
    }

    const srcKeys = Object.keys(source);
    const unknown = srcKeys.filter((k) => !hasOwn(this.shape, k));
    if (this.policy === "strict" && unknown.length > 0) {
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
