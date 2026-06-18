// New validators: alpha, numeric, symbol, phone + smart required behavior
import { test } from "node:test";
import assert from "node:assert/strict";
import { v, useLang } from "../dist/index.js";

useLang("en");

test("alpha - letters only", () => {
  const s = v.string().alpha();
  assert.equal(s.safeParse("abc").success, true);
  assert.equal(s.safeParse("ABCxyz").success, true);
  assert.equal(s.safeParse("abc123").success, false);
  assert.equal(s.safeParse("abc!").success, false);
  assert.equal(s.safeParse("").success, false); // empty rejected
});

test("numeric - digits only", () => {
  const s = v.string().numeric();
  assert.equal(s.safeParse("123").success, true);
  assert.equal(s.safeParse("0").success, true);
  assert.equal(s.safeParse("12.3").success, false);
  assert.equal(s.safeParse("12a").success, false);
  assert.equal(s.safeParse("").success, false);
});

test("symbol - symbols only, no letters/digits", () => {
  const s = v.string().symbol();
  assert.equal(s.safeParse("!@#").success, true);
  assert.equal(s.safeParse("---").success, true);
  assert.equal(s.safeParse("!@a").success, false);
  assert.equal(s.safeParse("").success, false);
});

test("phone - common formats", () => {
  const s = v.string().phone();
  assert.equal(s.safeParse("+62 812-3456-7890").success, true);
  assert.equal(s.safeParse("081234567890").success, true);
  assert.equal(s.safeParse("+1 (555) 123-4567").success, true);
  assert.equal(s.safeParse("abc").success, false);
  assert.equal(s.safeParse("").success, false);
});

test("smart required: empty string on required field", () => {
  const s = v.string().min(3, "Min 3");
  const r = s.safeParse("");
  assert.equal(r.success, false);
  assert.equal(r.errors[0].code, "required"); // NOT too_small
});

test("smart required: null on required field", () => {
  const s = v.string();
  const r = s.safeParse(null);
  assert.equal(r.success, false);
  assert.equal(r.errors[0].code, "required"); // NOT invalid_type
});

test("smart required: undefined on required field", () => {
  const s = v.string();
  const r = s.safeParse(undefined);
  assert.equal(r.success, false);
  assert.equal(r.errors[0].code, "required"); // NOT invalid_type
});

test("smart required: non-empty but too short → too_small", () => {
  const s = v.string().min(3, "Min 3");
  const r = s.safeParse("hu");
  assert.equal(r.success, false);
  assert.equal(r.errors[0].code, "too_small");
});

test("smart required: custom .required() message", () => {
  const s = v.string().required("Custom required msg").min(3);
  assert.equal(s.safeParse("").errors[0].message, "Custom required msg");
  // "hu" → too_small uses default template (no custom message set on .min)
  const r2 = s.safeParse("hu");
  assert.equal(r2.errors[0].code, "too_small");
  assert.ok(r2.errors[0].message);
});

test("smart required: .optional() allows empty string", () => {
  const s = v.string().min(3).optional();
  assert.equal(s.safeParse("").success, true);
  assert.equal(s.safeParse(undefined).success, true);
  assert.equal(s.safeParse("ab").success, false); // min still applies
});

test("smart required: .default() substitutes empty string", () => {
  const s = v.string().default("anon");
  assert.equal(s.safeParse("").data, "anon");
  assert.equal(s.safeParse(undefined).data, "anon");
  assert.equal(s.safeParse("x").data, "x");
});

test("smart required: field name appears in required message (id)", () => {
  useLang("id");
  const Form = v.object({
    name: v.string().required("Name tidak boleh kosong").min(3),
  });
  const r = Form.safeParse({ name: "" });
  assert.equal(r.errors[0].message, "Name tidak boleh kosong");
});

test("intersection of 3 schemas", () => {
  const A = v.object({ a: v.string() });
  const B = v.object({ b: v.number() });
  const C = v.object({ c: v.boolean() });
  const I = v.intersection(A, B, C);
  const ok = I.safeParse({ a: "x", b: 1, c: true });
  assert.equal(ok.success, true);
  assert.deepEqual(ok.data, { a: "x", b: 1, c: true });
});

test("intersection of 3 schemas - missing field fails", () => {
  const A = v.object({ a: v.string() });
  const B = v.object({ b: v.number() });
  const C = v.object({ c: v.boolean() });
  const I = v.intersection(A, B, C);
  const r = I.safeParse({ a: "x", c: true }); // missing b
  assert.equal(r.success, false);
});

test(".and() still works for 2 schemas", () => {
  const A = v.object({ a: v.string() });
  const B = v.object({ b: v.number() });
  const r = A.and(B).safeParse({ a: "x", b: 1 });
  assert.equal(r.success, true);
});
