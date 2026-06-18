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
      if (!r.success) ok(r.errors[0]?.message);
    });
  });

  describe("string.min", () => {
    const s = v.string().min(3);
    it("accepts long enough", () => equal(s.parse("abc"), "abc"));
    it("rejects short string", () => {
      const r = s.safeParse("ab");
      equal(r.success, false);
    });
  });

  describe("string.email", () => {
    const s = v.string().email();
    it("accepts valid email", () => equal(s.parse("a@b.c"), "a@b.c"));
    it("rejects invalid email", () => {
      const r = s.safeParse("not-email");
      equal(r.success, false);
    });
  });

  describe("number", () => {
    const s = v.number().min(1).max(10);
    it("parses in range", () => equal(s.parse(5), 5));
    it("rejects out of range", () => {
      equal(s.safeParse(0).success, false);
      equal(s.safeParse(11).success, false);
    });
  });

  describe("boolean", () => {
    it("parses boolean", () => equal(v.boolean().parse(true), true));
  });

  describe("object", () => {
    const schema = v.object({ name: v.string(), age: v.number() });
    it("parses valid object", () => {
      const r = schema.parse({ name: "Eki", age: 25 });
      equal(r.name, "Eki");
      equal(r.age, 25);
    });
    it("rejects missing field", () => {
      const r = schema.safeParse({ name: "Eki" });
      equal(r.success, false);
    });
    it("rejects wrong type", () => {
      const r = schema.safeParse({ name: "Eki", age: "invalid" });
      equal(r.success, false);
    });
  });

  describe("array", () => {
    const schema = v.array(v.number()).min(1);
    it("parses array", () => deepEqual(schema.parse([1, 2, 3]), [1, 2, 3]));
    it("rejects empty array", () => equal(schema.safeParse([]).success, false));
    it("rejects wrong item type", () => {
      const r = schema.safeParse([1, "x"]);
      equal(r.success, false);
    });
  });

  describe("multi-lang", () => {
    const s = v.string().min(3);
    it("uses id locale", () => {
      const r = s.safeParse("ab", { lang: "id" });
      equal(r.success, false);
      if (!r.success) ok(r.errors[0]?.message.includes("karakter"));
    });
    it("uses jp locale", () => {
      const r = s.safeParse("ab", { lang: "jp" });
      equal(r.success, false);
      if (!r.success) ok(r.errors[0]?.message.includes("文字"));
    });
    it("uses en locale by default", () => {
      const r = s.safeParse("ab");
      equal(r.success, false);
      if (!r.success) ok(r.errors[0]?.message.includes("characters"));
    });
  });

  describe("optional/nullable", () => {
    it("optional accepts undefined", () => {
      equal(v.string().optional().parse(undefined), undefined);
    });
    it("nullable accepts null", () => {
      equal(v.string().nullable().parse(null), null);
    });
    it("nullish accepts both", () => {
      equal(v.string().nullish().parse(undefined), undefined);
      equal(v.string().nullish().parse(null), null);
    });
  });

  describe("default", () => {
    it("applies default when undefined", () => {
      equal(v.string().default("n/a").parse(undefined), "n/a");
    });
    it("passes through when defined", () => {
      equal(v.string().default("n/a").parse("hello"), "hello");
    });
  });

  describe("union", () => {
    const schema = v.union([v.string(), v.number()]);
    it("accepts string", () => equal(schema.parse("hello"), "hello"));
    it("accepts number", () => equal(schema.parse(42), 42));
    it("rejects boolean", () => equal(schema.safeParse(true).success, false));
  });

  describe("enum", () => {
    const schema = v.enum(["a", "b", "c"]);
    it("accepts valid", () => equal(schema.parse("a"), "a"));
    it("rejects invalid", () => equal(schema.safeParse("d").success, false));
  });

  describe("literal", () => {
    const schema = v.literal("hello");
    it("accepts exact", () => equal(schema.parse("hello"), "hello"));
    it("rejects other", () => equal(schema.safeParse("world").success, false));
  });

  describe("ValdixError", () => {
    it("is thrown on parse failure", () => {
      try {
        v.string().min(5).parse("ab");
        ok(false, "should throw");
      } catch (e) {
        ok(e instanceof ValdixError);
        ok(e.issues.length > 0);
      }
    });
  });
});
