#!/usr/bin/env node
// Convert CJS .js files in dist/cjs/ to .cjs and fix require paths
import { readdir, readFile, writeFile, rename, unlink } from "node:fs/promises";
import { join, extname } from "node:path";

const DIST = "dist/cjs";

const fixRequires = (code) => code.replace(/require\((["'])(.+?)\.js\1\)/g, 'require($1$2.cjs$1)');

const walk = async (dir) => {
  const entries = await readdir(dir, { withFileTypes: true });
  const out = [];
  for (const e of entries) {
    const p = join(dir, e.name);
    if (e.isDirectory()) out.push(...await walk(p));
    else out.push(p);
  }
  return out;
};

const main = async () => {
  const files = await walk(DIST);
  for (const p of files) {
    if (extname(p) === ".js") {
      const src = await readFile(p, "utf8");
      const fixed = fixRequires(src);
      const target = p.replace(/\.js$/, ".cjs");
      await writeFile(target, fixed);
      await unlink(p);
    } else if (extname(p) === ".map" || p.endsWith(".d.ts")) {
      await unlink(p);
    }
  }
  console.log("CJS build done");
};

main().catch((e) => { console.error(e); process.exit(1); });
