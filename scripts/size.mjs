// Bundle size check
import { gzipSync } from "node:zlib";
import { readFile, stat } from "node:fs/promises";

const FILES = [
  "dist/index.js",
  "dist/index.d.ts",
];

const fmt = (n) => n.toLocaleString("en-US", { maximumFractionDigits: 1 });

for (const f of FILES) {
  try {
    const buf = await readFile(f);
    const s = await stat(f);
    const gz = gzipSync(buf, { level: 9 });
    console.log(`${f.padEnd(28)} raw=${fmt(s.size).padStart(8)}B  gz=${fmt(gz.length).padStart(8)}B`);
  } catch (e) {
    console.log(`${f.padEnd(28)} (missing)`);
  }
}
