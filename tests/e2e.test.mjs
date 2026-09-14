// End-to-end coverage for valdix as a real consumer would use it.
// Imports the built artifact (dist), not src. Covers every factory,
// every modifier family, i18n, JSON Schema, Standard Schema, and async.
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import v, {
  ValdixError,
  useLang,
  registerLocale,
  setErrorMap,
  getLocales,
} from "../dist/index.js";

const reset = () => {
  useLang("en");
  setErrorMap(undefined);
};

describe("e2e: signup form", () => {
  const Signup = v.object({
    username: v.string().min(3, "Username minimal 3 karakter ya"),
    email: v.string().email(),
    age: v.number().int().min(18),
    role: v.enum(["user", "admin"]).default("user"),
  });

  it("rejects bad input with field-aware errors", () => {
    useLang("id");
    const r = Signup.safeParse({ username: "ab", email: "bad", age: 15 });
    assert.equal(r.success, false);
    assert.equal(r.errors.length, 3);
    assert.equal(r.errors[0].message, "Username minimal 3 karakter ya");
    assert.equal(r.errors[0].field, "username");
    assert.deepEqual(r.errors[0].path, ["username"]);
    assert.ok(r.errors[1].message.length > 0);
    assert.ok(r.errors[2].message.length > 0);
    reset();
  });

  it("accepts good input and applies defaults", () => {
    const r = Signup.parse({
      username: "deni",
      email: "deni@mail.com",
      age: 25,
    });
    assert.equal(r.username, "deni");
    assert.equal(r.role, "user");
  });

  it("parse throws ValdixError with issues", () => {
    assert.throws(
      () => Signup.parse({ username: "ab", email: "bad", age: 15 }),
      (e) => e instanceof ValdixError && e.issues.length === 3
    );
  });
});

describe("e2e: i18n", () => {
  it("per-parse lang overrides global without leaking", () => {
    useLang("id");
    const s = v.string().min(3);
    const r = s.safeParse("ab", { lang: "en" });
    assert.equal(r.success, false);
    assert.ok(r.errors[0].message.includes("characters"));
    const r2 = s.safeParse("ab");
    assert.ok(r2.success === false && r2.errors[0].message.includes("karakter"));
    reset();
  });

  it("all registered locales produce a message", async () => {
    const locales = Object.keys(getLocales());
    assert.ok(locales.length >= 17);
    for (const code of locales) {
      const r = v.string().min(3).safeParse("ab", { lang: code });
      assert.equal(r.success, false);
      assert.ok(r.errors[0].message.length > 0, `empty message for ${code}`);
    }
    reset();
  });

  it("custom locale + global error map compose", () => {
    registerLocale("e2e-xx", { required: () => "E2E required" });
    setErrorMap((issue, ctx) => `[${issue.code}] ${ctx.defaultError}`);
    const r = v.object({ name: v.string() }).safeParse({ name: "" }, { lang: "e2e-xx" });
    assert.equal(r.success, false);
    assert.equal(r.errors[0].message, "[required] E2E required");
    reset();
  });

  it("field interpolation humanizes camelCase", () => {
    const s = v.object({ userName: v.string().min(3, "{{field}} minimal 3") });
    const r = s.safeParse({ userName: "ab" });
    assert.equal(r.success, false);
    assert.equal(r.errors[0].message, "user name minimal 3");
  });
});

describe("e2e: every factory parses", () => {
  it("primitives and wrappers", () => {
    assert.equal(v.string().parse("hi"), "hi");
    assert.equal(v.number().parse(1), 1);
    assert.equal(v.boolean().parse(true), true);
    assert.equal(v.bigint().parse(7n), 7n);
    assert.ok(v.date().parse("2024-01-01") instanceof Date);
    assert.equal(v.literal("a").parse("a"), "a");
    assert.equal(v.enum(["a", "b"]).parse("b"), "b");
    const Color = { Red: "red", Blue: "blue" };
    assert.equal(v.nativeEnum(Color).parse("red"), "red");
    class K {}
    assert.ok(v.instanceOf(K).parse(new K()) instanceof K);
    assert.equal(v.any().parse(1), 1);
    assert.equal(v.unknown().parse(null), null);
    assert.equal(v.null().parse(null), null);
    assert.equal(v.undefined().parse(undefined), undefined);
    assert.throws(() => v.never().parse("x"));
    assert.equal(v.void().parse(undefined), undefined);
  });

  it("string formats and transforms", () => {
    assert.equal(v.string().email().parse("a@b.c"), "a@b.c");
    assert.equal(v.string().uuid().parse("123e4567-e89b-12d3-a456-426614174000"), "123e4567-e89b-12d3-a456-426614174000");
    assert.equal(v.string().ip(4).parse("192.168.1.1"), "192.168.1.1");
    assert.equal(v.string().trim().parse("  hi  "), "hi");
    assert.equal(v.string().lowercase().parse("HI"), "hi");
    assert.equal(v.string().uppercase().parse("hi"), "HI");
    assert.equal(v.string().alpha().parse("abc"), "abc");
    assert.equal(v.string().numeric().parse("123"), "123");
    assert.equal(v.string().phone().parse("081234567890"), "081234567890");
  });

  it("collections, unions, objects", () => {
    assert.deepEqual(v.array(v.number()).parse([1, 2]), [1, 2]);
    assert.deepEqual(v.tuple(v.string(), v.number()).parse(["a", 1]), ["a", 1]);
    assert.deepEqual(v.record(v.string(), v.number()).parse({ a: 1 }), { a: 1 });
    assert.ok(v.set(v.string()).parse(new Set(["a"])) instanceof Set);
    assert.ok(v.map(v.string(), v.number()).parse(new Map([["a", 1]])) instanceof Map);
    assert.equal(v.union([v.string(), v.number()]).parse(1), 1);
    assert.deepEqual(
      v.intersection(v.object({ a: v.string() }), v.object({ b: v.number() })).parse({ a: "x", b: 1 }),
      { a: "x", b: 1 }
    );
    const E = v.discriminatedUnion("t", {
      a: v.object({ t: v.literal("a") }),
      b: v.object({ t: v.literal("b") }),
    });
    assert.deepEqual(E.parse({ t: "a" }), { t: "a" });
  });

  it("modifiers and object utilities", () => {
    assert.equal(v.string().optional().parse(undefined), undefined);
    assert.equal(v.string().nullable().parse(null), null);
    assert.equal(v.string().nullish().parse(null), null);
    assert.equal(v.string().default("d").parse(undefined), "d");
    assert.equal(v.string().min(5).catch("f").parse("ab"), "f");
    assert.equal(v.string().brand("B").parse("x"), "x");
    assert.equal(v.string().describe("d").parse("x"), "x");
    assert.equal(v.string().refine((s) => s.length > 1).parse("ab"), "ab");
    assert.equal(v.string().transform((s) => s.length).parse("ab"), 2);
    assert.equal(v.string().pipe(v.string().min(1)).parse("ab"), "ab");

    const S = v.object({ a: v.string(), b: v.number().optional() });
    assert.deepEqual(S.partial().parse({}), {});
    assert.deepEqual(S.pick(["a"]).parse({ a: "x" }), { a: "x" });
    assert.deepEqual(S.omit(["b"]).parse({ a: "x" }), { a: "x" });
    assert.deepEqual(S.extend({ c: v.boolean() }).parse({ a: "x", c: true }), { a: "x", c: true });
    assert.deepEqual(S.merge(v.object({ c: v.boolean() })).parse({ a: "x", c: true }), { a: "x", c: true });
    assert.equal(S.keyof().parse("a"), "a");
    assert.equal(S.strict().safeParse({ a: "x", z: 1 }).success, false);
    assert.equal(S.passthrough().parse({ a: "x", z: 1 }).z, 1);
    assert.equal(S.strip().parse({ a: "x", z: 1 }).z, undefined);
    assert.equal(v.object({ id: v.string() }).catchall(v.number()).parse({ id: "x", n: 1 }).n, 1);
    assert.equal(S.required().safeParse({ a: "x" }).success, false);
    assert.equal(S.readonly().parse({ a: "x" }).a, "x");
    assert.equal(v.strictObject({ a: v.string() }).parse({ a: "x" }).a, "x");
    assert.deepEqual(v.array(v.string()).nonempty().parse(["a"]), ["a"]);
    assert.deepEqual(v.array(v.string()).unique().parse(["a", "b"]), ["a", "b"]);
    assert.ok(v.date().min(new Date("2024-01-01")).parse(new Date("2024-06-01")) instanceof Date);
    assert.equal(v.string().or(v.number()).parse(1), 1);
    assert.deepEqual(v.object({ a: v.string() }).and(v.object({ b: v.number() })).parse({ a: "x", b: 1 }), { a: "x", b: 1 });
    assert.equal(v.coerce.number().parse("42"), 42);
    assert.equal(v.coerce.string().parse(42), "42");
    assert.equal(v.preprocess((x) => (typeof x === "string" ? parseInt(x) : x), v.number()).parse("42"), 42);
    const full = v.object({ a: v.string(), b: v.number() });
    assert.equal(full.safeParse({ a: "x" }, { abortEarly: true }).success, false);
  });
});

describe("e2e: recursive, function, async, interop", () => {
  it("recursive lazy tree", () => {
    let C;
    C = v.lazy(() =>
      v.object({ name: v.string(), children: v.array(C).optional() })
    );
    assert.equal(C.parse({ name: "r", children: [{ name: "c" }] }).name, "r");
    assert.equal(C.safeParse({ name: "r", children: [{ name: 1 }] }).success, false);
  });

  it("function implement validates args and return", () => {
    const F = v.function().args(v.tuple(v.string(), v.number())).returns(v.string());
    const fn = F.implement((a, b) => `${a}:${b}`);
    assert.equal(fn("a", 1), "a:1");
    assert.throws(() => fn("a", "b"));
  });

  it("async refine, superRefine, promise", async () => {
    const s = v.string().refine(async (val) => val === "ok");
    assert.equal((await s.safeParseAsync("ok")).success, true);
    assert.equal((await s.safeParseAsync("no")).success, false);

    const multi = v.string().superRefine((val, ctx) => {
      if (val.length < 3) ctx.addIssue({ code: "custom", message: "too short" });
    });
    assert.equal(multi.safeParse("ab").success, false);

    const r = await v.promise(v.string()).parseAsync(Promise.resolve("ok"));
    assert.equal(await r, "ok");
    await assert.rejects(v.promise(v.number()).parseAsync(Promise.resolve("bad")));
  });

  it("JSON Schema and Standard Schema", () => {
    const j = v
      .object({ name: v.string().min(1), age: v.number().int().optional() })
      .toJSONSchema();
    assert.equal(j.type, "object");
    assert.deepEqual(j.required, ["name"]);

    const std = v.string().min(3)["~standard"]();
    assert.equal(std.version, 1);
    assert.equal(std.vendor, "valdix");
    assert.ok("value" in std.validate("abcd"));
    const bad = std.validate("ab");
    assert.ok("issues" in bad && bad.issues.length === 1);
  });
});
