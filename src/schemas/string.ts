import { invalid, ok } from "../core/context.js";
import type { ParseContext, InternalResult } from "../core/context.js";
import { Schema, TransformSchema } from "../core/schema.js";
import { typeOf } from "../core/utils.js";

type Rule =
  | { kind: "min"; value: number }
  | { kind: "max"; value: number }
  | { kind: "length"; value: number }
  | { kind: "regex"; value: RegExp }
  | { kind: "email" }
  | { kind: "url" }
  | { kind: "uuid" }
  | { kind: "startsWith"; value: string }
  | { kind: "endsWith"; value: string }
  | { kind: "includes"; value: string };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export class StringSchema extends Schema<string> {
  constructor(private readonly rules: Rule[] = []) { super(); }
  private with(rule: Rule): StringSchema {
    return new StringSchema([...this.rules, rule]);
  }

  min(n: number): StringSchema { return this.with({ kind: "min", value: n }); }
  max(n: number): StringSchema { return this.with({ kind: "max", value: n }); }
  length(n: number): StringSchema { return this.with({ kind: "length", value: n }); }
  email(): StringSchema { return this.with({ kind: "email" }); }
  url(): StringSchema { return this.with({ kind: "url" }); }
  uuid(): StringSchema { return this.with({ kind: "uuid" }); }
  startsWith(s: string): StringSchema { return this.with({ kind: "startsWith", value: s }); }
  endsWith(s: string): StringSchema { return this.with({ kind: "endsWith", value: s }); }
  includes(s: string): StringSchema { return this.with({ kind: "includes", value: s }); }
  regex(pattern: RegExp): StringSchema { return this.with({ kind: "regex", value: pattern }); }
  trim(): TransformSchema<string, string, string> { return new TransformSchema(this, (s) => s.trim()); }
  lowercase(): TransformSchema<string, string, string> { return new TransformSchema(this, (s) => s.toLowerCase()); }
  uppercase(): TransformSchema<string, string, string> { return new TransformSchema(this, (s) => s.toUpperCase()); }

  _parse(input: unknown, ctx: ParseContext): InternalResult<string> {
    if (typeof input !== "string") {
      ctx.addIssue({ code: "invalid_type", expected: "string", received: typeOf(input) });
      return invalid;
    }
    for (const rule of this.rules) {
      if (rule.kind === "min" && input.length < rule.value) {
        ctx.addIssue({ code: "too_small", kind: "string", minimum: rule.value, inclusive: true });
        if (ctx.abortEarly) return invalid;
        continue;
      }
      if (rule.kind === "max" && input.length > rule.value) {
        ctx.addIssue({ code: "too_big", kind: "string", maximum: rule.value, inclusive: true });
        if (ctx.abortEarly) return invalid;
        continue;
      }
      if (rule.kind === "length" && input.length !== rule.value) {
        ctx.addIssue({
          code: input.length < rule.value ? "too_small" : "too_big",
          kind: "string", minimum: rule.value, maximum: rule.value, exact: true
        });
        if (ctx.abortEarly) return invalid;
        continue;
      }
      if (rule.kind === "email" && !EMAIL_RE.test(input)) {
        ctx.addIssue({ code: "invalid_string", validation: "email" });
        if (ctx.abortEarly) return invalid;
        continue;
      }
      if (rule.kind === "url") {
        try { new URL(input); } catch {
          ctx.addIssue({ code: "invalid_string", validation: "url" });
          if (ctx.abortEarly) return invalid;
        }
        continue;
      }
      if (rule.kind === "uuid" && !UUID_RE.test(input)) {
        ctx.addIssue({ code: "invalid_string", validation: "uuid" });
        if (ctx.abortEarly) return invalid;
        continue;
      }
      if (rule.kind === "regex" && !rule.value.test(input)) {
        ctx.addIssue({ code: "invalid_string", validation: "regex" });
        if (ctx.abortEarly) return invalid;
        continue;
      }
      if (rule.kind === "startsWith" && !input.startsWith(rule.value)) {
        ctx.addIssue({ code: "invalid_string", validation: `startsWith "${rule.value}"` });
        if (ctx.abortEarly) return invalid;
        continue;
      }
      if (rule.kind === "endsWith" && !input.endsWith(rule.value)) {
        ctx.addIssue({ code: "invalid_string", validation: `endsWith "${rule.value}"` });
        if (ctx.abortEarly) return invalid;
        continue;
      }
      if (rule.kind === "includes" && !input.includes(rule.value)) {
        ctx.addIssue({ code: "invalid_string", validation: `includes "${rule.value}"` });
        if (ctx.abortEarly) return invalid;
      }
    }
    return ok(input);
  }
}
