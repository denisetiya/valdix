// CJS smoke test
const { v, ValdixError, setErrorMap, useLang, registerLocale, EN, ID, JP } = require("../dist/cjs/index.cjs");

let ok = 0, fail = 0;
const t = (name, fn) => {
  try { fn(); console.log(`ok - ${name}`); ok++; }
  catch (e) { console.log(`not ok - ${name}\n  ${e.message}`); fail++; }
};
const equal = (a, b, msg) => { if (a !== b) throw new Error(`${msg || "eq"}: ${a} !== ${b}`); };

t("cjs string parse", () => equal(v.string().parse("hi"), "hi"));
t("cjs number parse", () => equal(v.number().parse(5), 5));
t("cjs object parse", () => equal(JSON.stringify(v.object({ a: v.string() }).parse({ a: "ok" })), JSON.stringify({ a: "ok" })));
t("cjs email validation", () => {
  const r = v.string().email().safeParse("bad");
  equal(r.success, false);
  equal(r.errors.length, 1);
});
t("cjs locale id", () => {
  useLang("id");
  const r = v.string().min(3).safeParse("ab");
  useLang("en");
  equal(r.success, false);
});
t("cjs describe + toJSONSchema", () => {
  const j = v.string().min(1).describe("name").toJSONSchema();
  equal(j.type, "string");
  equal(j.minLength, 1);
  equal(j.description, "name");
});
t("cjs ValdixError throws", () => {
  try { v.string().min(5).parse("ab"); }
  catch (e) { if (!(e instanceof ValdixError)) throw new Error("not ValdixError"); }
});
t("cjs register custom locale", () => {
  registerLocale("xx", { required: () => "XX-required", too_small: () => "XX-too-small" });
  const r = v.string().min(3).safeParse("ab", { lang: "xx" });
  equal(r.errors[0].message, "XX-too-small");
});

console.log(`\n1..${ok + fail}`);
console.log(`# pass ${ok}`);
console.log(`# fail ${fail}`);
process.exit(fail > 0 ? 1 : 0);
