import { Schema, OptionalSchema } from "../core/schema.js";
import type { ParseContext, InternalResult } from "../core/context.js";
import { invalid, ok } from "../core/context.js";
import { typeOf } from "../core/utils.js";

export class DiscriminatedUnionSchema<
  TKey extends string,
  TSchemas extends Record<string, Schema<any, any>>
> extends Schema<TSchemas[keyof TSchemas] extends Schema<infer O, any> ? O : never> {
  constructor(
    private readonly key: TKey,
    private readonly schemas: TSchemas,
  ) { super(); }
  _parse(input: unknown, ctx: ParseContext): InternalResult<any> {
    if (typeof input !== "object" || input === null) {
      ctx.addIssue({ code: "invalid_type", expected: "object", received: typeof input }); return invalid;
    }
    const disc = (input as Record<string, unknown>)[this.key];
    if (typeof disc !== "string" || !(disc in this.schemas)) {
      ctx.addIssue({
        code: "invalid_discriminator",
        discriminator: String(disc ?? ""),
        allowedDiscriminators: Object.keys(this.schemas),
      });
      return invalid;
    }
    return this.schemas[disc]!._parse(input, ctx);
  }
}

export class LazySchema<T extends Schema<any, any>> extends Schema<T["_output"]> {
  constructor(private readonly getter: () => T) { super(); }
  _parse(input: unknown, ctx: ParseContext): InternalResult<T["_output"]> {
    return this.getter()._parse(input, ctx);
  }
}

export class SetSchema<T extends Schema<any, any>> extends Schema<Set<T["_output"]>> {
  constructor(private readonly item: T) { super(); }
  _parse(input: unknown, ctx: ParseContext): InternalResult<Set<T["_output"]>> {
    if (!(input instanceof Set)) {
      ctx.addIssue({ code: "invalid_type", expected: "Set", received: typeOf(input) });
      return invalid;
    }
    const out = new Set<T["_output"]>();
    let i = 0;
    for (const val of input) {
      const child = ctx.childContext(String(i++));
      const parsed = this.item._parse(val, child);
      if (!parsed.ok) { if (ctx.abortEarly) return invalid; continue; }
      out.add(parsed.value);
    }
    return ok(out);
  }
}

export class MapSchema<TKey extends Schema<any, any>, TVal extends Schema<any, any>>
  extends Schema<Map<TKey["_output"], TVal["_output"]>> {
  constructor(
    private readonly keySchema: TKey,
    private readonly valSchema: TVal
  ) { super(); }
  _parse(input: unknown, ctx: ParseContext): InternalResult<Map<TKey["_output"], TVal["_output"]>> {
    if (!(input instanceof Map)) {
      ctx.addIssue({ code: "invalid_type", expected: "Map", received: typeOf(input) });
      return invalid;
    }
    const out = new Map<TKey["_output"], TVal["_output"]>();
    let i = 0;
    for (const [k, v] of input) {
      const kCtx = ctx.childContext(`${i}.key`);
      const parsedKey = this.keySchema._parse(k, kCtx);
      if (!parsedKey.ok) { if (ctx.abortEarly) return invalid; continue; }
      const vCtx = ctx.childContext(`${i}.value`);
      const parsedVal = this.valSchema._parse(v, vCtx);
      if (!parsedVal.ok) { if (ctx.abortEarly) return invalid; continue; }
      out.set(parsedKey.value, parsedVal.value);
      i++;
    }
    return ok(out);
  }
}
