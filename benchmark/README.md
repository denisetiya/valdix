# Benchmark method

Valdix ships two scripts. Both measure wall-clock throughput of `schema.parse(input)` on a fixed input. They report milliseconds and operations per second. Nothing else.

## Scripts

| Script | Command | What it does |
|--------|---------|--------------|
| `benchmark/run.mjs` | `npm run bench` | Parses 6 valdix schemas 50,000 times each. No dependency. |
| `benchmark/compare.mjs` | `npm run bench:compare` | Parses 5 equivalent valdix/zod schema pairs 100,000 times each. Requires `zod@3` resolvable from the working directory. |

## Cases

`run.mjs` covers: plain string, email string, min/max string, int-range number, a 3-field object, a string array.

`compare.mjs` covers the same families minus the deep case: string, email, int-range number, a 2-field object, a string array. Each case builds one valdix schema and one zod schema over the same fixed input.

## Procedure

1. Build first: `npm run build`. Both scripts import `../dist/index.js`.
2. Warmup: 1,000 parses per schema before timing. This lets V8 compile the hot path so the measured loop reflects steady state, not first-call cost.
3. Time with `performance.now()` around a tight `for` loop. No async, no I/O inside the loop.
4. `ops/s` is iterations divided by elapsed seconds.

## How to reproduce the README table

The README table (200k iterations, averaged across 5 runs, vs Zod 3.x) is a longer version of `compare.mjs` plus a deep-object case:

```bash
cd /tmp && mkdir bench && cd bench && npm init -y && npm i zod@3
ln -s /path/to/valdix/dist ./valdix
for i in 1 2 3 4 5; do node /path/to/valdix/benchmark/compare.mjs; done
```

Average the 5 runs per case. Run on an idle machine with nothing else competing for CPU.

## What the numbers mean (and what they don't)

`run.mjs` is a smoke check that parsing stays fast after a change. Compare its output before and after your edit on the same machine.

`compare.mjs` compares two libraries on identical inputs. It does not measure validation failure paths, async refinements, bundle size, memory use, or type inference quality. Treat a 10-20% gap as noise. Treat a 2x gap as real.

## Environment

Record these with any published number: CPU model, Node version, valdix version, zod version, iteration count, and run count. Numbers from different machines are not comparable.

## Measured results (2026-09-14)

Machine: AMD Ryzen 5 6600H with Radeon Graphics (12 threads), 16 GB RAM, Arch Linux (kernel 6.18.38-1-lts), Node v24.15.0 x64. Valdix 0.6.0.

### `npm run bench` (50,000 iterations per schema, 1,000 warmup parses), averaged across 5 runs

| case   | avg ops/s   | run 1     | run 2     | run 3     | run 4     | run 5     |
|--------|-------------|-----------|-----------|-----------|-----------|-----------|
| string | 4.43M       | 3.64M     | 4.31M     | 3.45M     | 6.33M     | 4.44M     |
| email  | 3.66M       | 3.16M     | 4.75M     | 2.88M     | 4.36M     | 3.14M     |
| minLen | 5.52M       | 6.47M     | 5.04M     | 4.85M     | 5.56M     | 5.70M     |
| number | 5.12M       | 5.29M     | 4.72M     | 4.63M     | 6.86M     | 4.10M     |
| obj    | 561k        | 512k      | 703k      | 509k      | 564k      | 519k      |
| array  | 2.84M       | 2.95M     | 3.04M     | 2.17M     | 2.98M     | 3.04M     |

Per-run spread is wide (CPU frequency scaling on a laptop). Use the average, not a single run. The object case is slowest because it validates 3 fields per iteration; the array case parses 3 items per iteration.

### `npm run bench:compare` vs Zod 3.25.76 (100,000 iterations per case, averaged across 5 runs)

Same machine. Zod installed in a scratch dir per `benchmark/README.md` procedure, valdix symlinked from this repo's `dist/`.

| case   | Valdix avg | Zod avg | result on this machine |
|--------|------------|---------|------------------------|
| string | 6.06M      | 6.21M   | about tied (Valdix 1.03-1.16x ahead in 4/5 runs) |
| email  | 4.33M      | 3.16M   | Valdix about 1.4x faster |
| number | 7.75M      | 5.48M   | Valdix about 1.4x faster |
| object | 1.28M      | 1.04M   | Valdix about 1.2x faster |
| array  | 4.27M      | 1.48M   | Valdix about 2.9x faster |

Raw runs: string Valdix 6.47/5.48/7.23/5.47/6.63M vs Zod 6.29/5.34/6.82/7.99/5.71M; email 4.64/4.34/4.19/4.20/4.31M vs 3.79/2.78/2.58/2.60/4.07M; number 8.17/7.24/5.85/8.12/9.34M vs 6.00/6.77/3.94/4.34/6.33M; object 1.17/1.45/1.53/1.13/1.14M vs 0.78/1.22/1.23/1.02/0.93M; array 4.00/4.96/3.62/3.63/5.13M vs 1.82/1.64/1.28/1.13/1.53M.

An older run on this same machine showed Zod ahead on strings, objects, and arrays. That run used a different Zod install state; re-running clean 5x with the current build shows Valdix ahead or tied everywhere. Throughput still flips by machine and version, so re-run on your hardware before repeating a claim.
