import type { LocaleCatalog } from "../core/types.js";

const humanize = (s: string) =>
  s.replace(/[_-]+/g, " ").replace(/([a-z])([A-Z])/g, "$1 $2").toLowerCase();

export const EN: LocaleCatalog = {
  required: (i) => `${i.field ? humanize(i.field) : "This field"} is required`,
  invalid_type: (i) => `Expected ${i.expected ?? "valid value"}, got ${i.received ?? "unknown"}`,
  invalid_literal: (i) => `Expected literal ${String(i.literal)}`,
  invalid_enum_value: (i) => `Expected one of: ${(i.options ?? []).map(String).join(", ")}`,
  too_small: (i) => {
    if (i.kind === "string" && typeof i.minimum === "number") {
      return i.exact
        ? `Must be exactly ${i.minimum} characters`
        : `Must be at least ${i.minimum} characters`;
    }
    if (i.kind === "number" && typeof i.minimum === "number") {
      return i.exact
        ? `Must be exactly ${i.minimum}`
        : `Must be at least ${i.minimum}`;
    }
    if (i.kind === "array" && typeof i.minimum === "number") {
      return `Need at least ${i.minimum} item(s)`;
    }
    return `Value is too small`;
  },
  too_big: (i) => {
    if (i.kind === "string" && typeof i.maximum === "number") {
      return i.exact
        ? `Must be exactly ${i.maximum} characters`
        : `Must be at most ${i.maximum} characters`;
    }
    if (i.kind === "number" && typeof i.maximum === "number") {
      return i.exact
        ? `Must be exactly ${i.maximum}`
        : `Must be at most ${i.maximum}`;
    }
    if (i.kind === "array" && typeof i.maximum === "number") {
      return `Need at most ${i.maximum} item(s)`;
    }
    return `Value is too big`;
  },
  invalid_string: (i) => {
    if (i.validation === "email") return "This doesn't look like a valid email";
    if (i.validation === "url") return "This doesn't look like a valid URL";
    if (i.validation === "uuid") return "This doesn't look like a valid UUID";
    if (i.validation === "regex") return "This format is not valid";
    if (i.validation === "alpha") return "Letters only (a-z, A-Z)";
    if (i.validation === "numeric") return "Digits only (0-9)";
    if (i.validation === "symbol") return "Symbols only, no letters or digits";
    if (i.validation === "phone") return "That doesn't look like a valid phone number";
    return "Invalid format";
  },
  invalid_number: () => "Please enter a valid number",
  invalid_date: () => "Please enter a valid date",
  invalid_array: () => "Expected a list of items",
  invalid_union: () => "Value didn't match any expected format",
  invalid_intersection: () => "Value doesn't meet all requirements",
  invalid_discriminator: (i) => `Unknown type "${i.discriminator}". Expected: ${(i.allowedDiscriminators ?? []).join(", ")}`,
  unknown_keys: (i) => `Unexpected field(s): ${(i.keys ?? []).join(", ")}`,
  invalid_tuple_length: (i) => `Expected ${i.minimum ?? "?"} item(s), got ${i.maximum ?? "?"}`,
  custom: () => "This value is not valid",
};
