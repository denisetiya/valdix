// Tree-shaking sanity check
// Each test should pass when valdix is imported piecemeal.
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  Schema,
  StringSchema,
  NumberSchema,
  ObjectSchema,
  ValdixError,
  setErrorMap,
  useLang,
  registerLocale,
  getErrorMap,
  getLocales,
  EN,
} from "../dist/index.js";

test("individual class imports work", () => {
  assert.ok(new StringSchema() instanceof Schema);
  assert.ok(new NumberSchema() instanceof Schema);
  assert.ok(new ObjectSchema({}) instanceof Schema);
});

test("individual functions work", () => {
  assert.equal(typeof setErrorMap, "function");
  assert.equal(typeof useLang, "function");
  assert.equal(typeof registerLocale, "function");
  assert.equal(typeof getLocales, "function");
});

test("ValdixError is constructable", () => {
  const e = new ValdixError([{ code: "x", message: "y" }]);
  assert.ok(e instanceof ValdixError);
  assert.equal(e.name, "ValdixError");
  assert.equal(e.issues.length, 1);
});

test("EN locale has all required codes", () => {
  for (const code of ["required", "invalid_type", "too_small", "too_big", "invalid_string"]) {
    assert.ok(EN[code], `missing ${code}`);
  }
});

test("setErrorMap + getErrorMap", () => {
  const prev = getErrorMap();
  setErrorMap((issue) => `[${issue.code}] ${issue.message ?? ""}`);
  const r = new StringSchema().safeParse(123);
  assert.equal(r.success, false);
  setErrorMap(prev);
});
