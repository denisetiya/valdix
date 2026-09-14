// v0.7 feature tests: new string/number/bigint/record/tuple/factories
import { test } from "node:test";
import assert from "node:assert/strict";
import { v } from "../dist/index.js";

test("string e164 strict", () => {
  assert.equal(v.string().e164().parse("+6281234567890"), "+6281234567890");
  assert.equal(v.string().e164().safeParse("081234567890").success, false);
  assert.equal(v.string().e164().safeParse("+62 812-3456").success, false);
});

test("string jwt shape", () => {
  assert.equal(v.string().jwt().parse("a.b.c"), "a.b.c");
  assert.equal(v.string().jwt().safeParse("not-a-jwt").success, false);
});

test("string mac address", () => {
  assert.equal(v.string().mac().parse("AA:BB:CC:DD:EE:FF"), "AA:BB:CC:DD:EE:FF");
  assert.equal(v.string().mac().parse("aa-bb-cc-dd-ee-ff"), "aa-bb-cc-dd-ee-ff");
  assert.equal(v.string().mac().safeParse("not-mac").success, false);
});

test("string semver", () => {
  assert.equal(v.string().semver().parse("1.2.3"), "1.2.3");
  assert.equal(v.string().semver().parse("1.0.0-beta.1+build"), "1.0.0-beta.1+build");
  assert.equal(v.string().semver().safeParse("1.2").success, false);
});

test("string creditCard luhn", () => {
  assert.equal(v.string().creditCard().parse("4111111111111111"), "4111111111111111");
  assert.equal(v.string().creditCard().parse("4111 1111 1111 1111"), "4111 1111 1111 1111");
  assert.equal(v.string().creditCard().safeParse("4111111111111112").success, false);
});

test("string imei luhn", () => {
  assert.equal(v.string().imei().parse("490154203237518"), "490154203237518");
  assert.equal(v.string().imei().safeParse("123").success, false);
  assert.equal(v.string().imei().safeParse("490154203237519").success, false);
});

test("string hash lengths", () => {
  assert.equal(v.string().hash("md5").parse("a".repeat(32)), "a".repeat(32));
  assert.equal(v.string().hash("sha256").parse("a".repeat(64)), "a".repeat(64));
  assert.equal(v.string().hash("sha256").safeParse("a".repeat(32)).success, false);
});

test("string hex and base64url", () => {
  assert.equal(v.string().hex().parse("0xdeadBEEF"), "0xdeadBEEF");
  assert.equal(v.string().hex().safeParse("xyz").success, false);
  assert.equal(v.string().base64url().parse("aGVsbG8"), "aGVsbG8");
  assert.equal(v.string().base64url().safeParse("not base64!").success, false);
});

test("string case and normalization checks", () => {
  assert.equal(v.string().lowercaseCheck().parse("abc"), "abc");
  assert.equal(v.string().lowercaseCheck().safeParse("Abc").success, false);
  assert.equal(v.string().uppercaseCheck().parse("ABC"), "ABC");
  assert.equal(v.string().uppercaseCheck().safeParse("aBC").success, false);
  assert.equal(v.string().normalized().parse("caf\u00e9"), "caf\u00e9");
  assert.equal(v.string().normalized().safeParse("e\u0301").success, false);
});

test("number nan opt-in", () => {
  assert.ok(Number.isNaN(v.number().nan().parse(NaN)));
  assert.equal(v.number().nan().safeParse(1).success, false);
  assert.equal(v.number().safeParse(NaN).success, false);
});

test("number step and custom messages", () => {
  assert.equal(v.number().step(5).parse(10), 10);
  assert.equal(v.number().step(5).safeParse(7).success, false);
  const r = v.number().int("must be whole").safeParse(1.5);
  assert.equal(r.errors[0].message, "must be whole");
  const r2 = v.number().positive("must be positive").safeParse(-1);
  assert.equal(r2.errors[0].message, "must be positive");
});

test("bigint min max", () => {
  assert.equal(v.bigint().min(5n).max(10n).parse(7n), 7n);
  assert.equal(v.bigint().min(5n).safeParse(3n).success, false);
  assert.equal(v.bigint().max(10n).safeParse(11n).success, false);
});

test("record min max and transformed keys", () => {
  assert.deepEqual(v.record(v.string(), v.number()).min(1).parse({ a: 1 }), { a: 1 });
  assert.equal(v.record(v.string(), v.number()).min(1).safeParse({}).success, false);
  assert.equal(v.record(v.string(), v.number()).max(1).safeParse({ a: 1, b: 2 }).success, false);
  const r = v.record(v.string().min(2), v.number()).safeParse({ a: 1 });
  assert.equal(r.success, false);
  assert.deepEqual(r.errors[0].path, []);
});

test("tuple rest items", () => {
  assert.deepEqual(v.tuple(v.string()).restItems(v.number()).parse(["a", 1, 2]), ["a", 1, 2]);
  assert.equal(v.tuple(v.string()).restItems(v.number()).safeParse(["a", "b"]).success, false);
  assert.equal(v.tuple(v.string()).safeParse(["a", "b"]).success, false);
});

test("file schema rejects non-file", () => {
  assert.equal(v.file().safeParse("not-a-file").success, false);
  assert.equal(v.file().safeParse({}).success, false);
});

test("templateLiteral matches parts", () => {
  const s = v.templateLiteral(["Hello, ", v.string().min(1), "!"]);
  assert.equal(s.parse("Hello, world!"), "Hello, world!");
  assert.equal(s.safeParse("Hi, world!").success, false);
  assert.equal(s.safeParse("Hello, world?").success, false);
});

test("custom type guard", () => {
  const isString = (x) => typeof x === "string";
  assert.equal(v.custom(isString).parse("hi"), "hi");
  assert.equal(v.custom(isString).safeParse(1).success, false);
});

test("union and intersection JSON Schema", () => {
  const u = v.union([v.string(), v.number()]).toJSONSchema();
  assert.ok(Array.isArray(u.anyOf) && u.anyOf.length === 2);
  const j = v
    .intersection(v.object({ a: v.string() }), v.object({ b: v.number() }))
    .toJSONSchema();
  assert.ok(Array.isArray(j.allOf) && j.allOf.length === 2);
});
