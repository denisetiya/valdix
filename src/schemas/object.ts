import { invalid, ok } from "../core/context.js";
import type { ParseContext, InternalResult } from "../core/context.js";
import { Schema, OptionalSchema } from "../core/schema.js";
import { typeOf, isPlainObject, hasOwn } from "../core/utils.js";

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
    for (const k of keys) picked[k] = this.shape[k] as T[K];
    return new ObjectSchema(picked as ObjectSchema<Pick<T, K>>["shape"], this.policy);
  }

  omit<K extends keyof T>(keys: K[]): ObjectSchema<Omit<T, K>> {
    const omitted = { ...this.shape } as Omit<T, K> & Record<string, Schema>;
    for (const k of keys) delete omitted[String(k)];
    return new ObjectSchema(omitted as ObjectSchema<Omit<T, K>>["shape"], this.policy);
  }

  partial(): ObjectSchema<{ [K in keyof T]: OptionalSchema<T[K]> }> {
    const shape = {} as { [K in keyof T]: OptionalSchema<T[K]> };
    for (const key of Object.keys(this.shape) as (keyof T)[]) {
      shape[key] = this.shape[key]!.optional() as unknown as OptionalSchema<T[typeof key]>;
    }
    return new ObjectSchema(shape as any, this.policy);
  }

  required(): ObjectSchema<RequiredShape<T>> {
    const shape = {} as RequiredShape<T>;
    for (const [key, s] of Object.entries(this.shape)) {
      (shape as any)[key] = s instanceof OptionalSchema ? (s as any).inner : s;
    }
    return new ObjectSchema(shape as any, this.policy);
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
      const schema = (this.shape as any)[key] as Schema;
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
