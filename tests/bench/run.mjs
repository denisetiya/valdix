// Micro benchmark for v0.x — compares simple object parse
// Usage: npm run bench
import { performance } from "node:perf_hooks";
import { v } from "../../dist/index.js";

const ITER = 50_000;

const schemas = {
  string: v.string(),
  email: v.string().email(),
  minLen: v.string().min(3).max(20),
  number: v.number().int().min(0).max(150),
  obj: v.object({
    name: v.string().min(1),
    email: v.string().email(),
    age: v.number().int().min(0),
  }),
  array: v.array(v.string().min(1)),
};

const cases = {
  string: "hello",
  email: "user@example.com",
  minLen: "hello world",
  number: 42,
  obj: { name: "Alice", email: "alice@example.com", age: 30 },
  array: ["a", "b", "c"],
};

const bench = (name, schema, input) => {
  // warmup
  for (let i = 0; i < 1000; i++) schema.parse(input);
  const t0 = performance.now();
  for (let i = 0; i < ITER; i++) schema.parse(input);
  const t1 = performance.now();
  const ms = t1 - t0;
  const ops = ITER / (ms / 1000);
  console.log(`${name.padEnd(10)} ${fmt(ms).padStart(8)} ms  ${fmt(ops).padStart(12)} ops/s`);
};

const fmt = (n) => Math.round(n).toLocaleString("en-US");

console.log(`\nValdix bench — ${ITER.toLocaleString()} iterations per schema\n`);
for (const [name, schema] of Object.entries(schemas)) {
  bench(name, schema, cases[name]);
}
