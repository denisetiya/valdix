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

  /** Reject unknown keys. */
  strict(): ObjectSchema<T> { return new ObjectSchema(this.shape, "strict", this._catchall); }
  /** Keep unknown keys in output. */
  passthrough(): ObjectSchema<T> { return new ObjectSchema(this.shape, "passthrough", this._catchall); }
  /** Strip unknown keys from output (default). */
  strip(): ObjectSchema<T> { return new ObjectSchema(this.shape, "strip", this._catchall); }
  /** Validate unknown keys against the given schema. */
  catchall(s: Schema<any, any>): ObjectSchema<T> { return new ObjectSchema(this.shape, "passthrough", s); }
  /** Merge additional fields. */
  extend<U extends ObjectShape>(shape: U): ObjectSchema<T & U> {
    return new ObjectSchema({ ...this.shape, ...shape } as T & U, this.policy, this._catchall);
  }
  /** Merge another object's shape. */
  merge<U extends ObjectShape>(other: ObjectSchema<U>): ObjectSchema<T & U> {
    return new ObjectSchema({ ...this.shape, ...other.shape } as T & U, this.policy, this._catchall);
  }
  /** Keep only the given keys. */
  pick<K extends keyof T>(keys: K[]): ObjectSchema<Pick<T, K>> {
    const picked = {} as Pick<T, K>;
    for (const k of keys) picked[k] = this.shape[k]! as T[K];
    return new ObjectSchema(picked as any, this.policy, this._catchall);
  }
  /** Remove the given keys. */
  omit<K extends keyof T>(keys: K[]): ObjectSchema<Omit<T, K>> {
    const omitted = { ...this.shape } as any;
    for (const k of keys) delete omitted[String(k)];
    return new ObjectSchema(omitted, this.policy, this._catchall);
  }
  /** Make all fields optional. */
  partial(): ObjectSchema<{ [K in keyof T]: OptionalSchema<T[K]> }> {
    const shape = {} as any;
    for (const key of Object.keys(this.shape)) shape[key] = this.shape[key]!.optional();
    return new ObjectSchema(shape, this.policy, this._catchall);
  }
  /** Make all fields (or only the given ones) required. */
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
  /** Build an enum schema of the object's keys. */
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
    const pathLen = ctx.pathStack.length;
    const shapeKeys = Object.keys(this.shape);
    const shapeLen = shapeKeys.length;

    for (let i = 0; i < shapeLen; i++) {
      const key = shapeKeys[i]!;
      const schema = this.shape[key]! as Schema;
      if (!hasOwn(source, key)) {
        // Probe for optional/default: if undefined is acceptable, skip
        const probe = ctx.fork();
        const fallback = schema._parseWithContext(undefined, probe);
        if (fallback.ok && probe.issues.length === 0) {
          if (typeof fallback.value !== "undefined") output[key] = fallback.value;
          continue;
        }
        ctx.pathStack.push(key);
        ctx.addIssue({ code: "required" });
        ctx.pathStack.length = pathLen;
        hasErr = true;
        if (ctx.abortEarly) return invalid;
        continue;
      }
      // Fast path: skip description wrapper when child has no description
      ctx.pathStack.push(key);
      const value = source[key];
      const parsed = schema.description
        ? schema._parseWithContext(value, ctx)
        : schema._parse(value, ctx);
      ctx.pathStack.length = pathLen;
      if (parsed.ok) {
        output[key] = parsed.value;
      } else {
        hasErr = true;
        if (ctx.abortEarly) return invalid;
      }
    }

    if (this._catchall) {
      const srcKeys = Object.keys(source);
      for (let i = 0; i < srcKeys.length; i++) {
        const k = srcKeys[i]!;
        if (hasOwn(this.shape, k)) continue;
        ctx.pathStack.push(k);
        const v = source[k];
        const parsed = (this._catchall as any).description
          ? (this._catchall as any)._parseWithContext(v, ctx)
          : (this._catchall as any)._parse(v, ctx);
        ctx.pathStack.length = pathLen;
        if (parsed.ok) output[k] = parsed.value;
        else { hasErr = true; if (ctx.abortEarly) return invalid; }
      }
    } else if (this.policy !== "strip") {
      const allKeys = Object.keys(source);
      const extraKeys: string[] = [];
      for (let i = 0; i < allKeys.length; i++) {
        const k = allKeys[i]!;
        if (!hasOwn(this.shape, k)) extraKeys.push(k);
      }
      if (this.policy === "strict" && extraKeys.length > 0) {
        ctx.addIssue({ code: "unknown_keys", keys: extraKeys });
        hasErr = true;
      } else if (this.policy === "passthrough") {
        for (let i = 0; i < extraKeys.length; i++) {
          const k = extraKeys[i]!;
          output[k] = source[k];
        }
      }
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
