import { invalid, ok } from "../core/context.js";
import type { ParseContext, InternalResult } from "../core/context.js";
import { Schema, TransformSchema, type jsonSchemaOf } from "../core/schema.js";
import { typeOf } from "../core/utils.js";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const URL_RE = /^https?:\/\/.+/;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const CUID_RE = /^c[a-z0-9]{24,}$/;
const CUID2_RE = /^[a-z][a-z0-9]{23,}$/;
const ULID_RE = /^[0-9A-HJKMNP-TV-Z]{26}$/;
const NANOID_RE = /^[A-Za-z0-9_-]{21}$/;
const BASE64_RE = /^[A-Za-z0-9+/]*={0,2}$/;
const EMOJI_RE = /^[\p{Emoji_Presentation}\p{Extended_Pictographic}]+$/u;
const ALPHA_RE = /^\p{L}+$/u;
const NUMERIC_RE = /^[0-9]+$/;
const SYMBOL_RE = /^[\p{S}\p{P}\p{Z}]+$/u;
// Phone: E.164 (+, country code, number) or common local formats (digits with optional separators)
const PHONE_RE = /^\+?[0-9]{1,4}?[-. \s]?(\(?[0-9]{1,4}\)?[-. \s]?){1,4}[0-9]{1,9}$/;
const E164_RE = /^\+[1-9]\d{6,14}$/;
const JWT_RE = /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/;
const MAC_RE = /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/;
const SEMVER_RE = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?$/;
const HEX_RE = /^(?:0x)?[0-9a-fA-F]+$/;
const BASE64URL_RE = /^[A-Za-z0-9_-]*={0,2}$/;

const luhnValid = (digits: string): boolean => {
  let sum = 0;
  let double = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let d = digits.charCodeAt(i) - 48;
    if (double) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
    double = !double;
  }
  return sum % 10 === 0;
};

const isCreditCard = (s: string): boolean => {
  const digits = s.replace(/[\s-]/g, "");
  return /^[0-9]{13,19}$/.test(digits) && luhnValid(digits);
};

const isImei = (s: string): boolean => /^\d{15}$/.test(s) && luhnValid(s);

const HASH_LENGTHS: Record<string, number> = { md5: 32, sha1: 40, sha256: 64, sha512: 128 };

const isValidIPv4 = (s: string): boolean => {
  const parts = s.split(".");
  if (parts.length !== 4) return false;
  return parts.every((p) => {
    if (!/^\d+$/.test(p)) return false;
    const n = Number(p);
    return n >= 0 && n <= 255 && String(n) === p.replace(/^0+/, "") || p === "0";
  });
};

const isValidIPv6 = (s: string): boolean => {
  if (!/^[0-9a-f:]+$/i.test(s)) return false;
  if (!IPV6_RE.test(s)) return false;
  return s.split(":").filter(Boolean).every((g) => g.length <= 4);
};
const IPV6_RE = /^[0-9a-fA-F:]+$/;

type Rule =
  | { kind: "min"; value: number; message?: string }
  | { kind: "max"; value: number; message?: string }
  | { kind: "length"; value: number; message?: string }
  | { kind: "email" }
  | { kind: "url" }
  | { kind: "uuid" }
  | { kind: "cuid" }
  | { kind: "cuid2" }
  | { kind: "ulid" }
  | { kind: "nanoid" }
  | { kind: "ip"; version?: 4 | 6 }
  | { kind: "cidr" }
  | { kind: "base64" }
  | { kind: "emoji" }
  | { kind: "datetime" }
  | { kind: "date" }
  | { kind: "time" }
  | { kind: "alpha"; message?: string }
  | { kind: "numeric"; message?: string }
  | { kind: "symbol"; message?: string }
  | { kind: "phone"; message?: string }
  | { kind: "e164"; message?: string }
  | { kind: "jwt"; message?: string }
  | { kind: "mac"; message?: string }
  | { kind: "semver"; message?: string }
  | { kind: "creditCard"; message?: string }
  | { kind: "imei"; message?: string }
  | { kind: "hash"; algorithm: "md5" | "sha1" | "sha256" | "sha512"; message?: string }
  | { kind: "hex"; message?: string }
  | { kind: "base64url"; message?: string }
  | { kind: "lowercase"; message?: string }
  | { kind: "uppercase"; message?: string }
  | { kind: "normalize"; message?: string }
  | { kind: "required"; message?: string }
  | { kind: "regex"; value: RegExp; message?: string }
  | { kind: "startsWith"; value: string }
  | { kind: "endsWith"; value: string }
  | { kind: "includes"; value: string };

export class StringSchema extends Schema<string> {
  private readonly rules: Rule[] = [];
  private customValidation?: { validation: string; format: Record<string, unknown> };
  private _minLen?: number;
  private _maxLen?: number;
  private _minMsg?: string;
  private _maxMsg?: string;
  // Hot-path flags for the most common format checks
  private _hasEmail = false;
  private _hasUrl = false;
  private _hasUuid = false;
  private _hasEmoji = false;
  private _hasDate = false;
  private _hasTime = false;
  private _hasBase64 = false;
  private _hasCuid = false;
  private _hasCuid2 = false;
  private _hasUlid = false;
  private _hasNanoid = false;
  private _hasIp?: 4 | 6 | "any";
  private _hasDatetime = false;
  private _hasCidr = false;
  private _hasAlpha = false;
  private _hasNumeric = false;
  private _hasSymbol = false;
  private _hasPhone = false;
  private _hasE164 = false;
  private _hasJwt = false;
  private _hasMac = false;
  private _hasSemver = false;
  private _hasCreditCard = false;
  private _hasImei = false;
  private _hashAlgo?: "md5" | "sha1" | "sha256" | "sha512";
  private _hasHex = false;
  private _hasBase64url = false;
  private _hasLowercase = false;
  private _hasUppercase = false;
  private _hasNormalize = false;
  private _requiredMsg?: string;

  constructor(rules: Rule[] = []) {
    super();
    this.rules = rules;
    for (const r of rules) {
      if (r.kind === "min") { this._minLen = r.value; this._minMsg = r.message; }
      if (r.kind === "max") { this._maxLen = r.value; this._maxMsg = r.message; }
      if (r.kind === "required") this._requiredMsg = r.message;
      if (r.kind === "email") this._hasEmail = true;
      if (r.kind === "url") this._hasUrl = true;
      if (r.kind === "uuid") this._hasUuid = true;
      if (r.kind === "emoji") this._hasEmoji = true;
      if (r.kind === "date") this._hasDate = true;
      if (r.kind === "time") this._hasTime = true;
      if (r.kind === "base64") this._hasBase64 = true;
      if (r.kind === "cuid") this._hasCuid = true;
      if (r.kind === "cuid2") this._hasCuid2 = true;
      if (r.kind === "ulid") this._hasUlid = true;
      if (r.kind === "nanoid") this._hasNanoid = true;
      if (r.kind === "ip") this._hasIp = r.version ?? "any";
      if (r.kind === "datetime") this._hasDatetime = true;
      if (r.kind === "cidr") this._hasCidr = true;
      if (r.kind === "alpha") this._hasAlpha = true;
      if (r.kind === "numeric") this._hasNumeric = true;
      if (r.kind === "symbol") this._hasSymbol = true;
      if (r.kind === "phone") this._hasPhone = true;
      if (r.kind === "e164") this._hasE164 = true;
      if (r.kind === "jwt") this._hasJwt = true;
      if (r.kind === "mac") this._hasMac = true;
      if (r.kind === "semver") this._hasSemver = true;
      if (r.kind === "creditCard") this._hasCreditCard = true;
      if (r.kind === "imei") this._hasImei = true;
      if (r.kind === "hash") this._hashAlgo = r.algorithm;
      if (r.kind === "hex") this._hasHex = true;
      if (r.kind === "base64url") this._hasBase64url = true;
      if (r.kind === "lowercase") this._hasLowercase = true;
      if (r.kind === "uppercase") this._hasUppercase = true;
      if (r.kind === "normalize") this._hasNormalize = true;
    }
  }
  private with(rule: Rule): StringSchema {
    // Pass rules including the new one. The constructor picks up
    // _minLen/_maxLen/_minMsg/_maxMsg from the new rule.
    const s = new StringSchema([...this.rules, rule]);
    s.customValidation = this.customValidation;
    if (rule.kind === "required") s._requiredMsg = rule.message;
    return s;
  }

  /** Require a minimum string length.
   * @param n minimum number of characters
   * @param message optional custom error message. Use `{{field}}` for the field label.
   * @example
   * ```ts
   * v.string().min(3)
   * v.string().min(3, "Minimal 3 karakter ya")
   * ```
   */
  min(n: number, message?: string): StringSchema {
    const s = this.with({ kind: "min", value: n, message });
    s._minLen = n;
    return s;
  }
  /** Require a maximum string length. */
  max(n: number, message?: string): StringSchema {
    const s = this.with({ kind: "max", value: n, message });
    s._maxLen = n;
    return s;
  }
  /** Require an exact string length. */
  length(n: number, message?: string): StringSchema { return this.with({ kind: "length", value: n, message }); }
  /** Validate as an email address (basic format check). */
  email(): StringSchema { const s = this.with({ kind: "email" }); s.customValidation = { validation: "email", format: { format: "email" } }; return s; }
  /** Validate as a URL. */
  url(): StringSchema { const s = this.with({ kind: "url" }); s.customValidation = { validation: "url", format: { format: "uri" } }; return s; }
  /** Validate as a UUID v1-v5. */
  uuid(): StringSchema { const s = this.with({ kind: "uuid" }); s.customValidation = { validation: "uuid", format: { format: "uuid" } }; return s; }
  /** Validate as a CUID v1. */
  cuid(): StringSchema { const s = this.with({ kind: "cuid" }); s.customValidation = { validation: "cuid", format: { pattern: CUID_RE.source } }; return s; }
  /** Validate as a CUID v2. */
  cuid2(): StringSchema { const s = this.with({ kind: "cuid2" }); s.customValidation = { validation: "cuid2", format: { pattern: CUID2_RE.source } }; return s; }
  /** Validate as a ULID. */
  ulid(): StringSchema { const s = this.with({ kind: "ulid" }); s.customValidation = { validation: "ulid", format: { pattern: ULID_RE.source } }; return s; }
  /** Validate as a Nano ID (21-char base64url). */
  nanoid(): StringSchema { const s = this.with({ kind: "nanoid" }); s.customValidation = { validation: "nanoid", format: { pattern: NANOID_RE.source } }; return s; }
  /** Validate as an IPv4 or IPv6 address. Pass `4` or `6` to restrict. */
  ip(version?: 4 | 6): StringSchema {
    const s = this.with({ kind: "ip", version });
    s.customValidation = { validation: version === 6 ? "ipv6" : version === 4 ? "ipv4" : "ip", format: { format: version === 6 ? "ipv6" : "ipv4" } };
    return s;
  }
  /** Validate as a CIDR notation (e.g. `192.168.1.0/24`). */
  cidr(): StringSchema { return this.with({ kind: "cidr" }); }
  /** Validate as base64-encoded. */
  base64(): StringSchema { return this.with({ kind: "base64" }); }
  /** Validate that the string contains only emoji characters. */
  emoji(): StringSchema { return this.with({ kind: "emoji" }); }
  /** Validate as an ISO 8601 datetime. */
  datetime(): StringSchema { return this.with({ kind: "datetime" }); }
  /** Validate as `YYYY-MM-DD`. */
  date(): StringSchema { return this.with({ kind: "date" }); }
  /** Validate as `HH:MM:SS` 24-hour time. */
  time(): StringSchema { return this.with({ kind: "time" }); }
  /** Require the string to start with `s2`. */
  startsWith(s2: string): StringSchema { return this.with({ kind: "startsWith", value: s2 }); }
  /** Require the string to end with `s2`. */
  endsWith(s2: string): StringSchema { return this.with({ kind: "endsWith", value: s2 }); }
  /** Require the string to include `s2`. */
  includes(s2: string): StringSchema { return this.with({ kind: "includes", value: s2 }); }
  /** Validate against a regular expression. */
  regex(pattern: RegExp, message?: string): StringSchema { return this.with({ kind: "regex", value: pattern, message }); }
  /** Shorthand for `.min(1)`. */
  nonempty(message?: string): StringSchema { return this.min(1, message); }
  /** Require only letters (a-z, A-Z). Unicode-aware. */
  alpha(message?: string): StringSchema {
    const s = this.with({ kind: "alpha", message });
    s.customValidation = { validation: "alpha", format: { pattern: "^\\p{L}+$" } };
    return s;
  }
  /** Require only digits (0-9). */
  numeric(message?: string): StringSchema {
    const s = this.with({ kind: "numeric", message });
    s.customValidation = { validation: "numeric", format: { pattern: "^[0-9]+$" } };
    return s;
  }
  /** Require only symbol/non-alphanumeric characters. */
  symbol(message?: string): StringSchema {
    const s = this.with({ kind: "symbol", message });
    s.customValidation = { validation: "symbol", format: { pattern: "^[\\p{S}\\p{P}\\p{Z}]+$" } };
    return s;
  }
  /** Validate as a phone number (E.164 or common local format). */
  phone(message?: string): StringSchema {
    const s = this.with({ kind: "phone", message });
    s.customValidation = { validation: "phone", format: { format: "phone" } };
    return s;
  }
  /** Validate as strict E.164 (e.g. `+6281234567890`). */
  e164(message?: string): StringSchema {
    const s = this.with({ kind: "e164", message });
    s.customValidation = { validation: "e164", format: { pattern: "^\\+[1-9]\\d{6,14}$" } };
    return s;
  }
  /** Validate as a JWT (three base64url segments). */
  jwt(message?: string): StringSchema {
    const s = this.with({ kind: "jwt", message });
    s.customValidation = { validation: "jwt", format: { format: "jwt" } };
    return s;
  }
  /** Validate as a MAC address (`AA:BB:CC:DD:EE:FF` or dash-separated). */
  mac(message?: string): StringSchema {
    const s = this.with({ kind: "mac", message });
    s.customValidation = { validation: "mac", format: { pattern: MAC_RE.source } };
    return s;
  }
  /** Validate as semver (`1.2.3`, prerelease and build metadata allowed). */
  semver(message?: string): StringSchema {
    const s = this.with({ kind: "semver", message });
    s.customValidation = { validation: "semver", format: { pattern: SEMVER_RE.source } };
    return s;
  }
  /** Validate as a credit card number (Luhn check, spaces/dashes allowed). */
  creditCard(message?: string): StringSchema {
    const s = this.with({ kind: "creditCard", message });
    s.customValidation = { validation: "creditCard", format: { format: "credit-card" } };
    return s;
  }
  /** Validate as a 15-digit IMEI (Luhn check). */
  imei(message?: string): StringSchema {
    const s = this.with({ kind: "imei", message });
    s.customValidation = { validation: "imei", format: { pattern: "^\\d{15}$" } };
    return s;
  }
  /** Validate as a hex hash digest (`md5`/`sha1`/`sha256`/`sha512`). */
  hash(algorithm: "md5" | "sha1" | "sha256" | "sha512", message?: string): StringSchema {
    const s = this.with({ kind: "hash", algorithm, message });
    s.customValidation = { validation: "hash", format: { pattern: `^[0-9a-fA-F]{${HASH_LENGTHS[algorithm]}}$` } };
    return s;
  }
  /** Validate as a hex string (optional `0x` prefix). */
  hex(message?: string): StringSchema {
    const s = this.with({ kind: "hex", message });
    s.customValidation = { validation: "hex", format: { pattern: HEX_RE.source } };
    return s;
  }
  /** Validate as base64url-encoded. */
  base64url(message?: string): StringSchema {
    const s = this.with({ kind: "base64url", message });
    s.customValidation = { validation: "base64url", format: { pattern: BASE64URL_RE.source } };
    return s;
  }
  /** Require all-lowercase letters. */
  lowercaseCheck(message?: string): StringSchema { return this.with({ kind: "lowercase", message }); }
  /** Require all-uppercase letters. */
  uppercaseCheck(message?: string): StringSchema { return this.with({ kind: "uppercase", message }); }
  /** Require NFC-normalized text. */
  normalized(message?: string): StringSchema { return this.with({ kind: "normalize", message }); }
  /**
   * Override the "tidak boleh kosong" / "required" message for the
   * empty/undefined/null case. The empty-string check runs first and
   * it produces this message instead of the type mismatch or min check.
   */
  required(message?: string): StringSchema { return this.with({ kind: "required", message }); }
  /** Transform: trim whitespace. */
  trim(): TransformSchema<string, string, string> { return new TransformSchema(this, (s) => s.trim()); }
  /** Transform: lowercase. */
  lowercase(): TransformSchema<string, string, string> { return new TransformSchema(this, (s) => s.toLowerCase()); }
  /** Transform: uppercase. */
  uppercase(): TransformSchema<string, string, string> { return new TransformSchema(this, (s) => s.toUpperCase()); }

  _toJSONSchema(): unknown {
    const base: Record<string, unknown> = { type: "string", ...(this.description ? { description: this.description } : {}) };
    if (this._minLen !== undefined) base.minLength = this._minLen;
    if (this._maxLen !== undefined) base.maxLength = this._maxLen;
    if (this.customValidation) Object.assign(base, this.customValidation.format);
    for (const r of this.rules) {
      if (r.kind === "regex") base.pattern = r.value.source;
      if (r.kind === "length") { base.minLength = r.value; base.maxLength = r.value; }
    }
    return base;
  }

  _parse(input: unknown, ctx: ParseContext): InternalResult<string> {
    // Smart "required": empty / null / undefined → "tidak boleh kosong" (or custom message).
    // Combined check using == for nullish (matches both null and undefined).
    const isString = typeof input === "string";
    if (!isString && (input == null || input === "")) {
      ctx.addIssue({ code: "required", message: this._requiredMsg });
      return invalid;
    }
    if (!isString) {
      ctx.addIssue({ code: "invalid_type", expected: "string", received: typeOf(input) });
      return invalid;
    }
    if (input.length === 0) {
      ctx.addIssue({ code: "required", message: this._requiredMsg });
      return invalid;
    }
    if (this.rules.length === 0) return ok(input);
    // Fast path: direct min/max length checks before the generic rule loop
    if (this._minLen !== undefined && input.length < this._minLen) {
      ctx.addIssue({ code: "too_small", kind: "string", minimum: this._minLen, inclusive: true, message: this._minMsg });
      return invalid;
    }
    if (this._maxLen !== undefined && input.length > this._maxLen) {
      ctx.addIssue({ code: "too_big", kind: "string", maximum: this._maxLen, inclusive: true, message: this._maxMsg });
      return invalid;
    }
    // Fast path: direct format checks
    if (this._hasEmail && !EMAIL_RE.test(input)) {
      ctx.addIssue({ code: "invalid_string", validation: "email" });
      return invalid;
    }
    if (this._hasUuid && !UUID_RE.test(input)) {
      ctx.addIssue({ code: "invalid_string", validation: "uuid" });
      return invalid;
    }
    if (this._hasUrl) { try { new URL(input); } catch { ctx.addIssue({ code: "invalid_string", validation: "url" }); return invalid; } }
    if (this._hasCuid && !CUID_RE.test(input)) { ctx.addIssue({ code: "invalid_string", validation: "cuid" }); return invalid; }
    if (this._hasCuid2 && !CUID2_RE.test(input)) { ctx.addIssue({ code: "invalid_string", validation: "cuid2" }); return invalid; }
    if (this._hasUlid && !ULID_RE.test(input)) { ctx.addIssue({ code: "invalid_string", validation: "ulid" }); return invalid; }
    if (this._hasNanoid && !NANOID_RE.test(input)) { ctx.addIssue({ code: "invalid_string", validation: "nanoid" }); return invalid; }
    if (this._hasEmoji && !EMOJI_RE.test(input)) { ctx.addIssue({ code: "invalid_string", validation: "emoji" }); return invalid; }
    if (this._hasDate && !/^\d{4}-\d{2}-\d{2}$/.test(input)) { ctx.addIssue({ code: "invalid_string", validation: "date" }); return invalid; }
    if (this._hasTime && !/^([01]\d|2[0-3]):[0-5]\d:[0-5]\d$/.test(input)) { ctx.addIssue({ code: "invalid_string", validation: "time" }); return invalid; }
    if (this._hasBase64 && !BASE64_RE.test(input)) { ctx.addIssue({ code: "invalid_string", validation: "base64" }); return invalid; }
    if (this._hasDatetime && isNaN(Date.parse(input))) { ctx.addIssue({ code: "invalid_string", validation: "datetime" }); return invalid; }
    if (this._hasIp) {
      const valid = this._hasIp === 6 ? isValidIPv6(input) : this._hasIp === 4 ? isValidIPv4(input) : (isValidIPv4(input) || isValidIPv6(input));
      if (!valid) { ctx.addIssue({ code: "invalid_string", validation: this._hasIp === 6 ? "ipv6" : this._hasIp === 4 ? "ipv4" : "ip" }); return invalid; }
    }
    if (this._hasCidr) {
      const parts = input.split("/");
      if (parts.length !== 2 || isNaN(Number(parts[1]))) { ctx.addIssue({ code: "invalid_string", validation: "cidr" }); return invalid; }
      const prefix = Number(parts[1]);
      const baseIP = parts[0] ?? "";
      const validIP = isValidIPv4(baseIP) ? (prefix >= 0 && prefix <= 32) : isValidIPv6(baseIP) ? (prefix >= 0 && prefix <= 128) : false;
      if (!validIP) { ctx.addIssue({ code: "invalid_string", validation: "cidr" }); return invalid; }
    }
    if (this._hasAlpha && !ALPHA_RE.test(input)) { ctx.addIssue({ code: "invalid_string", validation: "alpha" }); return invalid; }
    if (this._hasNumeric && !NUMERIC_RE.test(input)) { ctx.addIssue({ code: "invalid_string", validation: "numeric" }); return invalid; }
    if (this._hasSymbol && !SYMBOL_RE.test(input)) { ctx.addIssue({ code: "invalid_string", validation: "symbol" }); return invalid; }
    if (this._hasPhone && !PHONE_RE.test(input.replace(/[\s().-]/g, ""))) { ctx.addIssue({ code: "invalid_string", validation: "phone" }); return invalid; }
    if (this._hasE164 && !E164_RE.test(input)) { ctx.addIssue({ code: "invalid_string", validation: "e164" }); return invalid; }
    if (this._hasJwt && !JWT_RE.test(input)) { ctx.addIssue({ code: "invalid_string", validation: "jwt" }); return invalid; }
    if (this._hasMac && !MAC_RE.test(input)) { ctx.addIssue({ code: "invalid_string", validation: "mac" }); return invalid; }
    if (this._hasSemver && !SEMVER_RE.test(input)) { ctx.addIssue({ code: "invalid_string", validation: "semver" }); return invalid; }
    if (this._hasCreditCard && !isCreditCard(input)) { ctx.addIssue({ code: "invalid_string", validation: "creditCard" }); return invalid; }
    if (this._hasImei && !isImei(input)) { ctx.addIssue({ code: "invalid_string", validation: "imei" }); return invalid; }
    if (this._hashAlgo && !new RegExp(`^[0-9a-fA-F]{${HASH_LENGTHS[this._hashAlgo]}}$`).test(input)) { ctx.addIssue({ code: "invalid_string", validation: "hash" }); return invalid; }
    if (this._hasHex && !HEX_RE.test(input)) { ctx.addIssue({ code: "invalid_string", validation: "hex" }); return invalid; }
    if (this._hasBase64url && !BASE64URL_RE.test(input)) { ctx.addIssue({ code: "invalid_string", validation: "base64url" }); return invalid; }
    if (this._hasLowercase && input !== input.toLowerCase()) { ctx.addIssue({ code: "invalid_string", validation: "lowercase" }); return invalid; }
    if (this._hasUppercase && input !== input.toUpperCase()) { ctx.addIssue({ code: "invalid_string", validation: "uppercase" }); return invalid; }
    if (this._hasNormalize && input !== input.normalize("NFC")) { ctx.addIssue({ code: "invalid_string", validation: "normalized" }); return invalid; }
    // If every rule is covered by a fast path, skip the generic loop
    const fastPathCount = (this._minLen !== undefined ? 1 : 0) + (this._maxLen !== undefined ? 1 : 0)
      + (this._hasEmail ? 1 : 0) + (this._hasUrl ? 1 : 0) + (this._hasUuid ? 1 : 0) + (this._hasEmoji ? 1 : 0)
      + (this._hasDate ? 1 : 0) + (this._hasTime ? 1 : 0) + (this._hasBase64 ? 1 : 0) + (this._hasCuid ? 1 : 0)
      + (this._hasCuid2 ? 1 : 0) + (this._hasUlid ? 1 : 0) + (this._hasNanoid ? 1 : 0)
      + (this._hasDatetime ? 1 : 0) + (this._hasCidr ? 1 : 0) + (this._hasIp ? 1 : 0)
      + (this._hasAlpha ? 1 : 0) + (this._hasNumeric ? 1 : 0) + (this._hasSymbol ? 1 : 0) + (this._hasPhone ? 1 : 0)
      + (this._hasE164 ? 1 : 0) + (this._hasJwt ? 1 : 0) + (this._hasMac ? 1 : 0) + (this._hasSemver ? 1 : 0)
      + (this._hasCreditCard ? 1 : 0) + (this._hasImei ? 1 : 0) + (this._hashAlgo ? 1 : 0)
      + (this._hasHex ? 1 : 0) + (this._hasBase64url ? 1 : 0)
      + (this._hasLowercase ? 1 : 0) + (this._hasUppercase ? 1 : 0) + (this._hasNormalize ? 1 : 0);
    if (fastPathCount >= this.rules.length) return ok(input);
    let failed = false;
    for (const rule of this.rules) {
      if (rule.kind === "min" && input.length < rule.value) {
        ctx.addIssue({ code: "too_small", kind: "string", minimum: rule.value, inclusive: true, message: rule.message });
        failed = true; if (ctx.abortEarly) return invalid; continue;
      }
      if (rule.kind === "max" && input.length > rule.value) {
        ctx.addIssue({ code: "too_big", kind: "string", maximum: rule.value, inclusive: true, message: rule.message });
        failed = true; if (ctx.abortEarly) return invalid; continue;
      }
      if (rule.kind === "length" && input.length !== rule.value) {
        ctx.addIssue({
          code: input.length < rule.value ? "too_small" : "too_big",
          kind: "string", minimum: rule.value, maximum: rule.value, exact: true, message: rule.message
        });
        failed = true; if (ctx.abortEarly) return invalid; continue;
      }
      if (rule.kind === "email" && !EMAIL_RE.test(input)) {
        ctx.addIssue({ code: "invalid_string", validation: "email" });
        failed = true; if (ctx.abortEarly) return invalid; continue;
      }
      if (rule.kind === "url") {
        try { new URL(input); }
        catch { ctx.addIssue({ code: "invalid_string", validation: "url" }); failed = true; if (ctx.abortEarly) return invalid; }
        continue;
      }
      if (rule.kind === "uuid" && !UUID_RE.test(input)) {
        ctx.addIssue({ code: "invalid_string", validation: "uuid" });
        failed = true; if (ctx.abortEarly) return invalid; continue;
      }
      if (rule.kind === "cuid" && !CUID_RE.test(input)) {
        ctx.addIssue({ code: "invalid_string", validation: "cuid" });
        failed = true; if (ctx.abortEarly) return invalid; continue;
      }
      if (rule.kind === "cuid2" && !CUID2_RE.test(input)) {
        ctx.addIssue({ code: "invalid_string", validation: "cuid2" });
        failed = true; if (ctx.abortEarly) return invalid; continue;
      }
      if (rule.kind === "ulid" && !ULID_RE.test(input)) {
        ctx.addIssue({ code: "invalid_string", validation: "ulid" });
        failed = true; if (ctx.abortEarly) return invalid; continue;
      }
      if (rule.kind === "nanoid" && !NANOID_RE.test(input)) {
        ctx.addIssue({ code: "invalid_string", validation: "nanoid" });
        failed = true; if (ctx.abortEarly) return invalid; continue;
      }
      if (rule.kind === "ip") {
        const valid = rule.version === 6 ? isValidIPv6(input) : rule.version === 4 ? isValidIPv4(input) : (isValidIPv4(input) || isValidIPv6(input));
        if (!valid) {
          ctx.addIssue({ code: "invalid_string", validation: rule.version === 6 ? "ipv6" : rule.version === 4 ? "ipv4" : "ip" });
          failed = true; if (ctx.abortEarly) return invalid;
        }
        continue;
      }
      if (rule.kind === "cidr") {
        const parts = input.split("/");
        if (parts.length !== 2 || isNaN(Number(parts[1]))) {
          ctx.addIssue({ code: "invalid_string", validation: "cidr" });
          failed = true; if (ctx.abortEarly) return invalid; continue;
        }
        const prefix = Number(parts[1]);
        const baseIP = parts[0] ?? "";
        const validIP = isValidIPv4(baseIP) ? (prefix >= 0 && prefix <= 32) : isValidIPv6(baseIP) ? (prefix >= 0 && prefix <= 128) : false;
        if (!validIP) { ctx.addIssue({ code: "invalid_string", validation: "cidr" }); failed = true; if (ctx.abortEarly) return invalid; }
        continue;
      }
      if (rule.kind === "base64" && !BASE64_RE.test(input)) {
        ctx.addIssue({ code: "invalid_string", validation: "base64" });
        failed = true; if (ctx.abortEarly) return invalid; continue;
      }
      if (rule.kind === "emoji" && !EMOJI_RE.test(input)) {
        ctx.addIssue({ code: "invalid_string", validation: "emoji" });
        failed = true; if (ctx.abortEarly) return invalid; continue;
      }
      if (rule.kind === "datetime" && isNaN(Date.parse(input))) {
        ctx.addIssue({ code: "invalid_string", validation: "datetime" });
        failed = true; if (ctx.abortEarly) return invalid; continue;
      }
      if (rule.kind === "date" && !/^\d{4}-\d{2}-\d{2}$/.test(input)) {
        ctx.addIssue({ code: "invalid_string", validation: "date" });
        failed = true; if (ctx.abortEarly) return invalid; continue;
      }
      if (rule.kind === "time" && !/^([01]\d|2[0-3]):[0-5]\d:[0-5]\d$/.test(input)) {
        ctx.addIssue({ code: "invalid_string", validation: "time" });
        failed = true; if (ctx.abortEarly) return invalid; continue;
      }
      if (rule.kind === "regex" && !rule.value.test(input)) {
        ctx.addIssue({ code: "invalid_string", validation: "regex", message: rule.message });
        failed = true; if (ctx.abortEarly) return invalid; continue;
      }
      if (rule.kind === "startsWith" && !input.startsWith(rule.value)) {
        ctx.addIssue({ code: "invalid_string", validation: `startsWith "${rule.value}"` });
        failed = true; if (ctx.abortEarly) return invalid; continue;
      }
      if (rule.kind === "endsWith" && !input.endsWith(rule.value)) {
        ctx.addIssue({ code: "invalid_string", validation: `endsWith "${rule.value}"` });
        failed = true; if (ctx.abortEarly) return invalid; continue;
      }
      if (rule.kind === "includes" && !input.includes(rule.value)) {
        ctx.addIssue({ code: "invalid_string", validation: `includes "${rule.value}"` });
        failed = true; if (ctx.abortEarly) return invalid;
      }
      if (rule.kind === "alpha" && !ALPHA_RE.test(input)) {
        ctx.addIssue({ code: "invalid_string", validation: "alpha", message: rule.message });
        failed = true; if (ctx.abortEarly) return invalid;
      }
      if (rule.kind === "numeric" && !NUMERIC_RE.test(input)) {
        ctx.addIssue({ code: "invalid_string", validation: "numeric", message: rule.message });
        failed = true; if (ctx.abortEarly) return invalid;
      }
      if (rule.kind === "symbol" && !SYMBOL_RE.test(input)) {
        ctx.addIssue({ code: "invalid_string", validation: "symbol", message: rule.message });
        failed = true; if (ctx.abortEarly) return invalid;
      }
      if (rule.kind === "phone" && !PHONE_RE.test(input.replace(/[\s().-]/g, ""))) {
        ctx.addIssue({ code: "invalid_string", validation: "phone", message: rule.message });
        failed = true; if (ctx.abortEarly) return invalid;
      }
      if (rule.kind === "e164" && !E164_RE.test(input)) {
        ctx.addIssue({ code: "invalid_string", validation: "e164", message: rule.message });
        failed = true; if (ctx.abortEarly) return invalid;
      }
      if (rule.kind === "jwt" && !JWT_RE.test(input)) {
        ctx.addIssue({ code: "invalid_string", validation: "jwt", message: rule.message });
        failed = true; if (ctx.abortEarly) return invalid;
      }
      if (rule.kind === "mac" && !MAC_RE.test(input)) {
        ctx.addIssue({ code: "invalid_string", validation: "mac", message: rule.message });
        failed = true; if (ctx.abortEarly) return invalid;
      }
      if (rule.kind === "semver" && !SEMVER_RE.test(input)) {
        ctx.addIssue({ code: "invalid_string", validation: "semver", message: rule.message });
        failed = true; if (ctx.abortEarly) return invalid;
      }
      if (rule.kind === "creditCard" && !isCreditCard(input)) {
        ctx.addIssue({ code: "invalid_string", validation: "creditCard", message: rule.message });
        failed = true; if (ctx.abortEarly) return invalid;
      }
      if (rule.kind === "imei" && !isImei(input)) {
        ctx.addIssue({ code: "invalid_string", validation: "imei", message: rule.message });
        failed = true; if (ctx.abortEarly) return invalid;
      }
      if (rule.kind === "hash" && !new RegExp(`^[0-9a-fA-F]{${HASH_LENGTHS[rule.algorithm]}}$`).test(input)) {
        ctx.addIssue({ code: "invalid_string", validation: "hash", message: rule.message });
        failed = true; if (ctx.abortEarly) return invalid;
      }
      if (rule.kind === "hex" && !HEX_RE.test(input)) {
        ctx.addIssue({ code: "invalid_string", validation: "hex", message: rule.message });
        failed = true; if (ctx.abortEarly) return invalid;
      }
      if (rule.kind === "base64url" && !BASE64URL_RE.test(input)) {
        ctx.addIssue({ code: "invalid_string", validation: "base64url", message: rule.message });
        failed = true; if (ctx.abortEarly) return invalid;
      }
      if (rule.kind === "lowercase" && input !== input.toLowerCase()) {
        ctx.addIssue({ code: "invalid_string", validation: "lowercase", message: rule.message });
        failed = true; if (ctx.abortEarly) return invalid;
      }
      if (rule.kind === "uppercase" && input !== input.toUpperCase()) {
        ctx.addIssue({ code: "invalid_string", validation: "uppercase", message: rule.message });
        failed = true; if (ctx.abortEarly) return invalid;
      }
      if (rule.kind === "normalize" && input !== input.normalize("NFC")) {
        ctx.addIssue({ code: "invalid_string", validation: "normalized", message: rule.message });
        failed = true; if (ctx.abortEarly) return invalid;
      }
    }
    if (failed) return invalid;
    return ok(input);
  }
}
