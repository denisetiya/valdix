import { test } from "node:test";
import assert from "node:assert/strict";
import { v } from "../dist/index.js";

test("function - implement validates args", () => {
  const F = v.function().args(v.tuple(v.string(), v.number())).returns(v.string());
  const fn = F.implement((a, b) => a + b);
  assert.equal(fn("a", 1), "a1");
  assert.throws(() => fn("a", "b"), /Expected number/);
});

test("function - implement validates return", () => {
  const F = v.function().args(v.tuple(v.string())).returns(v.string());
  const fn = F.implement(() => 1);
  assert.throws(() => fn("a"), /Expected string/);
});

test("function - parse checks type", () => {
  const F = v.function();
  assert.throws(() => F.parse("not a fn"), /function/);
  assert.doesNotThrow(() => F.parse(() => 1));
});

test("function - toJSONSchema", () => {
  const j = v.function().toJSONSchema();
  assert.equal(j.type, "function");
});

test("promise - parseAsync resolves and validates", async () => {
  const r = await v.promise(v.string()).parseAsync(Promise.resolve("ok"));
  assert.equal(await r, "ok");
});

test("promise - parseAsync rejects on bad value", async () => {
  await assert.rejects(
    v.promise(v.number()).parseAsync(Promise.resolve("bad"))
  );
});

test("promise - sync parse passes through", () => {
  const p = v.promise(v.string()).parse(Promise.resolve("hi"));
  assert.ok(p instanceof Promise);
});
