import { describe, it } from "node:test";
import { equal, deepEqual, ok } from "node:assert/strict";
import { v, ValdixError } from "../dist/index.js";

describe("valdix", () => {
  describe("string", () => {
    const s = v.string();
    it("parses string", () => equal(s.parse("hello"), "hello"));
    it("rejects number", () => {
      const r = s.safeParse(123);
      equal(r.success, false);
    });
    it("nonempty rejects empty", () => equal(v.string().nonempty().safeParse("").success, false));
  });

  describe("string refinements", () => {
    it("min", () => equal(v.string().min(3).safeParse("ab").success, false));
    it("max", () => equal(v.string().max(3).safeParse("abcd").success, false));
    it("email", () => equal(v.string().email().safeParse("bad").success, false));
    it("email passes", () => equal(v.string().email().parse("a@b.c"), "a@b.c"));
    it("url", () => equal(v.string().url().safeParse("not-url").success, false));
    it("uuid", () => equal(v.string().uuid().safeParse("bad").success, false));
    it("regex", () => equal(v.string().regex(/^\d+$/).safeParse("abc").success, false));
    it("startsWith", () => equal(v.string().startsWith("hi").safeParse("no").success, false));
    it("endsWith", () => equal(v.string().endsWith("!").safeParse("no").success, false));
    it("includes", () => equal(v.string().includes("foo").safeParse("bar").success, false));
  });

  describe("number", () => {
    it("in range", () => equal(v.number().min(1).max(10).parse(5), 5));
    it("too small", () => equal(v.number().min(3).safeParse(2).success, false));
    it("too big", () => equal(v.number().max(3).safeParse(4).success, false));
    it("int", () => equal(v.number().int().safeParse(1.5).success, false));
    it("positive", () => equal(v.number().positive().safeParse(0).success, false));
    it("negative", () => equal(v.number().negative().safeParse(5).success, false));
    it("finite", () => equal(v.number().finite().safeParse(Infinity).success, false));
    it("multipleOf", () => equal(v.number().multipleOf(5).safeParse(7).success, false));
    it("gt", () => equal(v.number().gt(3).safeParse(3).success, false));
    it("lt", () => equal(v.number().lt(3).safeParse(3).success, false));
    it("safe", () => equal(v.number().safe().safeParse(Number.MAX_SAFE_INTEGER + 1).success, false));
  });

  describe("boolean", () => {
    it("true", () => equal(v.boolean().parse(true), true));
    it("rejects string", () => equal(v.boolean().safeParse("true").success, false));
  });

  describe("bigint", () => {
    it("parses bigint", () => equal(v.bigint().parse(42n), 42n));
    it("parses number to bigint", () => equal(v.bigint().parse(42), 42n));
    it("rejects string", () => equal(v.bigint().safeParse("abc").success, false));
  });

  describe("date", () => {
    it("parses Date", () => ok(v.date().parse(new Date()) instanceof Date));
    it("parses string", () => ok(v.date().parse("2024-01-01") instanceof Date));
    it("rejects invalid", () => equal(v.date().safeParse("not-a-date").success, false));
  });

  describe("literal", () => {
    it("exact match", () => equal(v.literal("hello").parse("hello"), "hello"));
    it("reject mismatch", () => equal(v.literal(42).safeParse(43).success, false));
  });

  describe("enum", () => {
    it("accepts valid", () => equal(v.enum(["a", "b"]).parse("a"), "a"));
    it("rejects invalid", () => equal(v.enum(["a", "b"]).safeParse("c").success, false));
  });

  describe("instanceOf", () => {
    class MyClass {}
    it("accepts instance", () => ok(v.instanceOf(MyClass).parse(new MyClass()) instanceof MyClass));
    it("rejects non-instance", () => equal(v.instanceOf(MyClass).safeParse({}).success, false));
  });

  describe("object", () => {
    const schema = v.object({ name: v.string(), age: v.number() });
    it("parses valid", () => {
      const r = schema.parse({ name: "Eki", age: 25 });
      equal(r.name, "Eki");
      equal(r.age, 25);
    });
    it("rejects missing field", () => equal(schema.safeParse({ name: "Eki" }).success, false));
    it("rejects wrong type", () => equal(schema.safeParse({ name: 123, age: "x" }).success, false));
    it("strict rejects unknown", () => {
      const s = v.object({ a: v.string() }).strict();
      equal(s.safeParse({ a: "ok", extra: true }).success, false);
    });
    it("passthrough keeps unknown", () => {
      const s = v.object({ a: v.string() }).passthrough();
      const r = s.parse({ a: "ok", extra: true });
      equal(r.extra, true);
    });
    it("partial", () => {
      const r = schema.partial().parse({});
      equal(r.name, undefined);
    });
    it("pick", () => {
      const r = schema.pick(["name"]).parse({ name: "Eki" });
      equal(r.age, undefined);
    });
    it("omit", () => {
      const r = schema.omit(["age"]).parse({ name: "Eki" });
      equal(r.age, undefined);
    });
    it("extend", () => {
      const r = schema.extend({ email: v.string() }).parse({ name: "Eki", age: 25, email: "a@b.c" });
      equal(r.email, "a@b.c");
    });
    it("required specific keys", () => {
      const s = v.object({ a: v.string().optional(), b: v.string().optional() }).required(["a"]);
      equal(s.safeParse({ a: "ok" }).success, true);
      equal(s.safeParse({ b: "ok" }).success, false);
    });
    it("keyof", () => {
      const keys = schema.keyof();
      equal(keys.parse("name"), "name");
      equal(keys.parse("age"), "age");
      equal(keys.safeParse("other").success, false);
    });
  });

  describe("array", () => {
    const schema = v.array(v.number()).min(1).max(3);
    it("parses", () => deepEqual(schema.parse([1, 2]), [1, 2]));
    it("rejects empty", () => equal(schema.safeParse([]).success, false));
    it("rejects too many", () => equal(schema.safeParse([1, 2, 3, 4]).success, false));
    it("rejects wrong type", () => equal(schema.safeParse([1, "x"]).success, false));
    it("length exact", () => equal(v.array(v.string()).length(2).safeParse(["a", "b", "c"]).success, false));
  });

  describe("tuple", () => {
    const t = v.tuple(v.string(), v.number());
    it("parses", () => deepEqual(t.parse(["a", 1]), ["a", 1]));
    it("rejects length", () => equal(t.safeParse(["a"]).success, false));
    it("rejects type", () => equal(t.safeParse(["a", "b"]).success, false));
  });

  describe("record", () => {
    const schema = v.record(v.string(), v.number());
    it("parses", () => deepEqual(schema.parse({ a: 1, b: 2 }), { a: 1, b: 2 }));
    it("rejects invalid value", () => equal(schema.safeParse({ a: "x" }).success, false));
  });

  describe("set", () => {
    const s = v.set(v.number());
    it("parses Set", () => {
      const r = s.parse(new Set([1, 2, 3]));
      ok(r instanceof Set);
      equal(r.size, 3);
    });
    it("rejects array", () => equal(s.safeParse([1, 2]).success, false));
  });

  describe("map", () => {
    const m = v.map(v.string(), v.number());
    it("parses Map", () => {
      const r = m.parse(new Map([["a", 1], ["b", 2]]));
      ok(r instanceof Map);
      equal(r.get("a"), 1);
    });
  });

  describe("union", () => {
    const schema = v.union([v.string(), v.number()]);
    it("accepts string", () => equal(schema.parse("hi"), "hi"));
    it("accepts number", () => equal(schema.parse(42), 42));
    it("rejects boolean", () => equal(schema.safeParse(true).success, false));
    it("single schema returns itself", () => {
      const s = v.union([v.string()]);
      equal(s.parse("hi"), "hi");
    });
  });

  describe("discriminatedUnion", () => {
    const schema = v.discriminatedUnion("type", {
      a: v.object({ type: v.literal("a"), val: v.string() }),
      b: v.object({ type: v.literal("b"), num: v.number() }),
    });
    it("parses variant a", () => deepEqual(schema.parse({ type: "a", val: "hi" }), { type: "a", val: "hi" }));
    it("parses variant b", () => deepEqual(schema.parse({ type: "b", num: 42 }), { type: "b", num: 42 }));
    it("rejects unknown discriminator", () => equal(schema.safeParse({ type: "c" }).success, false));
  });

  describe("modifiers", () => {
    it("optional", () => equal(v.string().optional().parse(undefined), undefined));
    it("nullable", () => equal(v.string().nullable().parse(null), null));
    it("nullish", () => { equal(v.string().nullish().parse(undefined), undefined); equal(v.string().nullish().parse(null), null); });
    it("default", () => equal(v.string().default("n/a").parse(undefined), "n/a"));
    it("catch", () => equal(v.string().min(5).catch("fallback").parse("ab"), "fallback"));
  });

  describe("brand", () => {
    it("brands type", () => {
      const UserId = v.string().brand("UserId");
      const id = UserId.parse("abc123");
      // At runtime it's just a string
      equal(id, "abc123");
    });
  });

  describe("transform", () => {
    const s = v.string().transform((s) => parseInt(s));
    it("transforms", () => equal(s.parse("42"), 42));
    it("type is number", () => { equal(s.parse("10"), 10); });
  });

  describe("pipe", () => {
    const s = v.string().pipe(v.string().min(3));
    it("pipes through", () => equal(s.parse("hello"), "hello"));
    it("rejects at second schema", () => equal(s.safeParse("ab").success, false));
  });

  describe("refine", () => {
    const s = v.string().refine((s) => s.length > 3);
    it("passes", () => equal(s.parse("abcd"), "abcd"));
    it("rejects", () => equal(s.safeParse("ab").success, false));
  });

  describe("instanceOf", () => {
    it("validates class", () => {
      class Foo {}
      const s = v.instanceOf(Foo);
      equal(s.parse(new Foo()) instanceof Foo, true);
      equal(s.safeParse({}).success, false);
    });
  });

  describe("coerce", () => {
    it("string", () => equal(v.coerce.string().parse(42), "42"));
    it("number", () => equal(v.coerce.number().parse("42"), 42));
    it("boolean true", () => equal(v.coerce.boolean().parse(1), true));
    it("boolean false", () => equal(v.coerce.boolean().parse("false"), false));
  });

  describe("preprocess", () => {
    const s = v.preprocess((x) => (typeof x === "string" ? parseInt(x) : x), v.number().min(0));
    it("preprocesses string to number", () => equal(s.parse("42"), 42));
    it("passes through number", () => equal(s.parse(10), 10));
  });

  describe("multi-lang", () => {
    const s = v.string().min(3);
    it("id", () => {
      const r = s.safeParse("ab", { lang: "id" });
      ok(!r.success && r.errors[0].message.includes("karakter"));
    });
    it("jp", () => {
      const r = s.safeParse("ab", { lang: "jp" });
      ok(!r.success && r.errors[0].message.includes("文字"));
    });
    it("en default", () => {
      const r = s.safeParse("ab");
      ok(!r.success && r.errors[0].message.includes("characters"));
    });
  });

  describe("async", () => {
    it("parseAsync works", async () => {
      const r = await v.string().parseAsync("hello");
      equal(r, "hello");
    });
    it("safeParseAsync catches errors", async () => {
      const r = await v.string().min(5).safeParseAsync("ab");
      equal(r.success, false);
    });
  });

  describe("ValdixError", () => {
    it("throws on parse failure", () => {
      try { v.string().min(5).parse("ab"); ok(false, "should throw"); }
      catch (e) { ok(e instanceof ValdixError); ok(e.issues.length > 0); }
    });
  });
});
