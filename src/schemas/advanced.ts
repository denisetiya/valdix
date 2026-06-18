import { Schema } from "../core/schema.js";
import type { ParseContext, InternalResult } from "../core/context.js";
import { invalid, ok } from "../core/context.js";

export class DiscriminatedUnionSchema<
  TKey extends string,
  TSchemas extends Record<string, Schema<any, any>>
> extends Schema<
  TSchemas[keyof TSchemas] extends Schema<infer O, any> ? O : never
> {
  constructor(
    private readonly key: TKey,
    private readonly schemas: TSchemas,
    private readonly label: string = ""
  ) { super(); }

  _parse(input: unknown, ctx: ParseContext): InternalResult<any> {
    if (typeof input !== "object" || input === null) {
      ctx.addIssue({ code: "invalid_type", expected: "object", received: typeof input });
      return invalid;
    }
    const disc = (input as Record<string, unknown>)[this.key];
    const label = this.label || String(this.key);
    if (typeof disc !== "string" || !(disc in this.schemas)) {
      ctx.addIssue({
        code: "invalid_discriminator",
        discriminator: String(disc ?? ""),
        allowedDiscriminators: Object.keys(this.schemas),
      });
      return invalid;
    }
    return (this.schemas[disc] as Schema<any, any>)._parse(input, ctx);
  }
}

export class LazySchema<T extends Schema<any, any>> extends Schema<T["_output"]> {
  constructor(private readonly getter: () => T) { super(); }
  _parse(input: unknown, ctx: ParseContext): InternalResult<T["_output"]> {
    return this.getter()._parse(input, ctx);
  }
}
