// Valdix vs Zod comparison
// Setup: cd /tmp && mkdir bench && cd bench && npm init -y && npm i zod@3
//        ln -s /path/to/valdix/dist ./valdix
//        node /path/to/valdix/tests/bench/compare.mjs
//
// Note: This script expects to be run with valdix's dist/ resolvable.
import { performance } from "node:perf_hooks";
import { v as valdix } from "../../dist/index.js";
import { z as zod } from "zod";

const ITER = 100_000;
const fmt = (n) => Math.round(n).toLocaleString("en-US");

const cases = {
  string: { v: () => valdix.string(), z: () => zod.string(), input: "hi" },
  email: {
    v: () => valdix.string().email(),
    z: () => zod.string().email(),
    input: "user@example.com",
  },
  number: {
    v: () => valdix.number().int().min(0),
    z: () => zod.number().int().min(0),
    input: 42,
  },
  object: {
    v: () =>
      valdix.object({
        name: valdix.string().min(1),
        age: valdix.number().int().min(0),
      }),
    z: () =>
      zod.object({
        name: zod.string().min(1),
        age: zod.number().int().min(0),
      }),
    input: { name: "Alice", age: 30 },
  },
  array: {
    v: () => valdix.array(valdix.string()),
    z: () => zod.array(zod.string()),
    input: ["a", "b", "c"],
  },
};

console.log(`\nValdix vs Zod — ${ITER.toLocaleString()} iterations per schema\n`);
console.log(
  "case".padEnd(10) +
    "valdix ms".padStart(12) +
    "ops/s".padStart(14) +
    "zod ms".padStart(10) +
    "ops/s".padStart(14) +
    "ratio".padStart(20)
);
console.log("─".repeat(80));

for (const [name, c] of Object.entries(cases)) {
  const vs = c.v();
  const zs = c.z();
  for (let i = 0; i < 1000; i++) {
    vs.parse(c.input);
    zs.parse(c.input);
  }
  let t0 = performance.now();
  for (let i = 0; i < ITER; i++) vs.parse(c.input);
  const vt = performance.now() - t0;
  t0 = performance.now();
  for (let i = 0; i < ITER; i++) zs.parse(c.input);
  const zt = performance.now() - t0;
  const ratio = vt / zt;
  const w = ratio < 1 ? `valdix ${(1 / ratio).toFixed(2)}x faster` : `zod ${ratio.toFixed(2)}x faster`;
  console.log(
    name.padEnd(10) +
      fmt(vt).padStart(12) +
      fmt((ITER / vt) * 1000).padStart(14) +
      fmt(zt).padStart(10) +
      fmt((ITER / zt) * 1000).padStart(14) +
      w.padStart(20)
  );
}
