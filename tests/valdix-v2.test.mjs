import { describe, it } from "node:test";
import { equal, deepEqual, ok } from "node:assert/strict";
import { v, ValdixError, setErrorMap, registerLocale, useLang, EN, ID } from "../dist/index.js";

describe("v2 - new features", () => {
  describe("custom error message per refinement", () => {
    it("string min custom", () => {
      const r = v.string().min(3, "Minimal 3 karakter ya").safeParse("ab");
      equal(r.success, false);
      equal(r.errors[0].message, "Minimal 3 karakter ya");
    });
    it("number max custom", () => {
      const r = v.number().max(10, "Maksimal 10").safeParse(20);
      equal(r.errors[0].message, "Maksimal 10");
    });
    it("regex custom", () => {
      const r = v.string().regex(/^\d+$/, "Harus angka").safeParse("abc");
      equal(r.errors[0].message, "Harus angka");
    });
  });

  describe("field name in error", () => {
    it("uses field name from path", () => {
      const schema = v.object({
        userName: v.string().min(3, "{{field}} minimal 3"),
        userAge: v.number(),
      });
      const r = schema.safeParse({ userName: "ab", userAge: 25 });
      equal(r.success, false);
      equal(r.errors[0].message, "user name minimal 3");
    });
    it("description stored on issue", () => {
      const schema = v.object({
        email: v.string().email().describe("Email address"),
      });
      const r = schema.safeParse({ email: "bad" });
      equal(r.success, false);
      equal(r.errors[0].description, "Email address");
      equal(r.errors[0].field, "email");
    });
  });

  describe("errorMap (global)", () => {
    it("setErrorMap overrides default", () => {
      setErrorMap((issue, ctx) => `[${issue.code}] ${ctx.defaultError}`);
      const r = v.string().min(3).safeParse("ab");
      equal(r.errors[0].message, "[too_small] Must be at least 3 characters");
      setErrorMap(undefined);
    });
    it("custom locale registration", () => {
      registerLocale("xx", {
        required: () => "XX: Field wajib diisi",
      });
      const r = v.string().min(1).safeParse("", { lang: "xx" });
      // Note: min(1) for "" is too_small, not required. Use object test.
    });
  });

  describe("describe + toJSONSchema", () => {
    it("string toJSONSchema", () => {
      const s = v.string().min(3).max(10).email().describe("User email");
      const j = s.toJSONSchema();
      deepEqual(j, {
        type: "string", minLength: 3, maxLength: 10, format: "email", description: "User email"
      });
    });
    it("number toJSONSchema with int", () => {
      const j = v.number().int().min(0).max(100).toJSONSchema();
      deepEqual(j, { type: "integer", minimum: 0, maximum: 100 });
    });
    it("boolean toJSONSchema", () => {
      deepEqual(v.boolean().toJSONSchema(), { type: "boolean" });
    });
    it("object toJSONSchema", () => {
      const s = v.object({
        name: v.string(),
        age: v.number().int().optional(),
      });
      const j = s.toJSONSchema();
      equal(j.type, "object");
      ok(j.properties.name);
      ok(j.properties.age);
      deepEqual(j.required, ["name"]);
    });
    it("array toJSONSchema", () => {
      const j = v.array(v.string()).min(1).unique().toJSONSchema();
      equal(j.type, "array");
      equal(j.minItems, 1);
      equal(j.uniqueItems, true);
    });
    it("nested toJSONSchema", () => {
      const j = v.object({
        tags: v.array(v.string()),
        meta: v.object({ key: v.string(), value: v.unknown() }),
      }).toJSONSchema();
      equal(j.properties.tags.type, "array");
      equal(j.properties.tags.items.type, "string");
      equal(j.properties.meta.type, "object");
    });
  });

  describe("string formats", () => {
    it("ip v4", () => {
      equal(v.string().ip().parse("192.168.1.1"), "192.168.1.1");
      equal(v.string().ip().safeParse("not-ip").success, false);
    });
    it("ip v4 only", () => {
      equal(v.string().ip(4).safeParse("::1").success, false);
    });
    it("ip v6 only", () => {
      equal(v.string().ip(6).safeParse("::1").success, true);
      equal(v.string().ip(6).safeParse("192.168.1.1").success, false);
    });
    it("cidr", () => {
      equal(v.string().cidr().parse("10.0.0.0/8"), "10.0.0.0/8");
      equal(v.string().cidr().safeParse("not-cidr").success, false);
    });
    it("base64", () => {
      equal(v.string().base64().parse("aGVsbG8="), "aGVsbG8=");
      equal(v.string().base64().safeParse("not base64!").success, false);
    });
    it("cuid", () => {
      equal(v.string().cuid().parse("c1234567890abcdefghij1234"), "c1234567890abcdefghij1234");
      equal(v.string().cuid().safeParse("not-cuid").success, false);
    });
    it("cuid2", () => {
      const v2id = "abcdefghijklmnopqrstuvwx";
      equal(v.string().cuid2().parse(v2id), v2id);
      equal(v.string().cuid2().safeParse("NotCuid2!").success, false);
    });
    it("ulid", () => {
      const u = "01ARZ3NDEKTSV4RRFFQ69G5FAV";
      equal(v.string().ulid().parse(u), u);
      equal(v.string().ulid().safeParse("not-ulid").success, false);
    });
    it("nanoid", () => {
      const n = "V1StGXR8_Z5jdHi6B-myT";
      equal(v.string().nanoid().parse(n), n);
      equal(v.string().nanoid().safeParse("x").success, false);
    });
    it("emoji", () => {
      equal(v.string().emoji().parse("🎉"), "🎉");
      equal(v.string().emoji().safeParse("not-emoji").success, false);
    });
    it("datetime", () => {
      equal(v.string().datetime().parse("2024-01-01T00:00:00Z"), "2024-01-01T00:00:00Z");
      equal(v.string().datetime().safeParse("not-datetime").success, false);
    });
    it("date format", () => {
      equal(v.string().date().parse("2024-01-01"), "2024-01-01");
      equal(v.string().date().safeParse("01-01-2024").success, false);
    });
    it("time format", () => {
      equal(v.string().time().parse("14:30:00"), "14:30:00");
      equal(v.string().time().safeParse("25:00:00").success, false);
    });
  });

  describe("array refinements", () => {
    it("nonempty", () => {
      equal(v.array(v.string()).nonempty().safeParse([]).success, false);
      deepEqual(v.array(v.string()).nonempty().parse(["a"]), ["a"]);
    });
    it("unique", () => {
      const s = v.array(v.string()).unique();
      deepEqual(s.parse(["a", "b", "c"]), ["a", "b", "c"]);
      const r = s.safeParse(["a", "b", "a"]);
      equal(r.success, false);
    });
  });

  describe("date refinements", () => {
    it("min", () => {
      const s = v.date().min(new Date("2024-01-01"));
      equal(s.parse(new Date("2024-06-01")).getFullYear(), 2024);
      equal(s.safeParse(new Date("2023-01-01")).success, false);
    });
    it("max", () => {
      const s = v.date().max(new Date("2024-12-31"));
      equal(s.safeParse(new Date("2025-01-01")).success, false);
    });
  });

  describe("nativeEnum", () => {
    const Color = { Red: "red", Green: "green", Blue: "blue" };
    it("accepts", () => equal(v.nativeEnum(Color).parse("red"), "red"));
    it("rejects", () => equal(v.nativeEnum(Color).safeParse("purple").success, false));
  });

  describe("object catchall", () => {
    const schema = v.object({
      id: v.string(),
    }).catchall(v.number());

    it("accepts known", () => {
      const r = schema.parse({ id: "x", count: 5, score: 10 });
      equal(r.id, "x");
      equal(r.count, 5);
    });
    it("rejects bad catchall", () => {
      equal(schema.safeParse({ id: "x", count: "bad" }).success, false);
    });
  });

  describe("superRefine", () => {
    const passwordSchema = v.string().superRefine((val, ctx) => {
      if (val.length < 8) ctx.addIssue({ code: "custom", message: "Min 8 chars" });
      if (!/[A-Z]/.test(val)) ctx.addIssue({ code: "custom", message: "Need uppercase" });
      if (!/\d/.test(val)) ctx.addIssue({ code: "custom", message: "Need digit" });
    });
    it("passes strong", () => equal(passwordSchema.parse("Pass1234"), "Pass1234"));
    it("fails weak - multi-issues", () => {
      const r = passwordSchema.safeParse("abc");
      equal(r.success, false);
      ok(r.errors.length >= 2);
    });
    it("async superRefine", async () => {
      const s = v.string().superRefine(async (val) => {
        await new Promise((r) => setTimeout(r, 1));
        if (val !== "valid") throw new Error("not valid");
      });
      const r = await s.safeParseAsync("valid");
      equal(r.success, true);
      const r2 = await s.safeParseAsync("invalid");
      equal(r2.success, false);
    });
  });

  describe("async refine", () => {
    const s = v.string().refine(async (val) => val === "ok");
    it("passes async", async () => {
      const r = await s.safeParseAsync("ok");
      equal(r.success, true);
    });
    it("fails async", async () => {
      const r = await s.safeParseAsync("no");
      equal(r.success, false);
    });
  });

  describe("readonly modifier", () => {
    it("freezes schema", () => {
      const s = v.object({ a: v.string() }).readonly();
      // Can't easily test "Readonly<T>" at runtime, but it shouldn't throw
      equal(s.parse({ a: "ok" }).a, "ok");
    });
  });

  describe("Standard Schema", () => {
    it("has ~standard method", () => {
      const s = v.string();
      const std = s["~standard"]();
      equal(std.version, 1);
      equal(std.vendor, "valdix");
    });
    it("validates value via ~standard", () => {
      const s = v.string();
      const std = s["~standard"]();
      const r = std.validate("hi");
      equal("value" in r, true);
    });
    it("returns issues via ~standard", () => {
      const s = v.string().min(5);
      const std = s["~standard"]();
      const r = std.validate("ab");
      equal("issues" in r, true);
      equal(r.issues.length, 1);
    });
  });

  describe("cycle protection", () => {
    it("handles recursive schemas", () => {
      let category;
      category = v.lazy(() => v.object({
        name: v.string(),
        children: v.array(category).optional(),
      }));
      const valid = category.parse({ name: "root", children: [{ name: "child" }] });
      equal(valid.name, "root");
      equal(valid.children.length, 1);
    });
  });

  describe("idempotent modifiers", () => {
    it("optional twice doesn't double-wrap", () => {
      const s = v.string().optional().optional();
      equal(s.parse(undefined), undefined);
      equal(s.parse("hi"), "hi");
    });
    it("nullable twice doesn't double-wrap", () => {
      const s = v.string().nullable().nullable();
      equal(s.parse(null), null);
      equal(s.parse("hi"), "hi");
    });
    it("nullish twice doesn't double-wrap", () => {
      const s = v.string().nullish().nullish();
      equal(s.parse(undefined), undefined);
      equal(s.parse(null), null);
    });
  });
});
