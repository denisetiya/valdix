---
layout: ../layouts/Base.astro
title: Migrating from Zod
description: Mechanical migration notes from Zod to Valdix, with API differences and performance context.
---

# Migrating from Zod

Valdix is API-compatible with most of Zod. The migration is mostly mechanical.

## Imports

```ts
// Zod
import { z } from "zod";

// Valdix
import v from "valdix";
```

## Schema construction

```ts
// Zod
const User = z.object({
  name: z.string().min(3),
  email: z.string().email(),
  age: z.number().int().min(0),
});

// Valdix: identical
const User = v.object({
  name: v.string().min(3),
  email: v.string().email(),
  age: v.number().int().min(0),
});
```

## Type inference

```ts
// Zod
type User = z.infer<typeof User>;

// Valdix
type User = v.Infer<typeof User>;
```

## safeParse output

```ts
// Zod
const r = User.safeParse(input);
if (!r.success) {
  r.error.issues.forEach((i) => {
    console.log(i.path, i.message, i.code);
  });
}

// Valdix: flatter, ready for UI
const r = User.safeParse(input);
if (!r.success) {
  r.errors.forEach((e) => {
    console.log(e.path, e.message, e.code, e.field);
  });
}
```

`ValdixError` (thrown by `.parse()`) has the same `issues` array as `r.errors`.

## Multi-language

The big difference. Valdix errors are localized and casual:

```ts
v.useLang("id");
const r = User.safeParse({ name: "E", email: "bad", age: -1 });
// r.errors[0] → { field: "name", message: "Minimal 1 karakter ya", code: "too_small" }
```

Zod has no built-in i18n. You typically write a custom error map (Zod v3.20+):

```ts
z.setErrorMap((issue, ctx) => {
  return "...";
});
```

Valdix ships 17 locales (en/id/jp/zh/zh-TW/ko/fr/pt/nl/es/de/ar/ru/it/vi/hi/th) out of the box. Add your own with `v.registerLocale(lang, catalog)`.

## Custom messages

```ts
// Zod
z.string().min(3, { message: "Minimal 3 karakter" });

// Valdix
v.string().min(3, "Minimal 3 karakter");
```

Valdix supports `{{field}}` interpolation:

```ts
v.object({
  userName: v.string().min(3, "{{field}} minimal 3"),
});
// → "user name minimal 3"
```

## Async

```ts
// Zod
const r = await User.parseAsync(input);

// Valdix
const r = await User.parseAsync(input);
// or
const r = await User.safeParseAsync(input);
```

`.superRefine` is async-friendly in both.

## Differences to watch

| Feature | Zod | Valdix |
|---------|-----|--------|
| Custom error code at parse | `z.NEVER`, `z.never()` | `v.never()` |
| Branded types | `z.string().brand<"UserId">()` | `v.string().brand("UserId")` |
| `passthrough` | `z.object({...}).passthrough()` | `.passthrough()` (default is `strip`) |
| Default behavior | `strip` | `strip` |
| `.refine` returns | `boolean \| { message, path? }` | `boolean \| string \| IssueInput` |
| `.discriminatedUnion` | `z.discriminatedUnion("type", {...})` | `v.discriminatedUnion("type", {...})` (no array form yet) |
| `z.stringIP()`, etc. | Yes | `v.string().ip()` |
| `z.coerce.*` | Yes | `v.coerce.*` |
| `z.function()` | Yes | `v.function()` |
| `z.lazy()` | Yes | `v.lazy()` |
| `z.preprocess()` | Yes | `v.preprocess()` |
| JSON Schema export | Via `zod-to-json-schema` | `.toJSONSchema()` (built-in) |
| Standard Schema | `z.standard()` | `schema["~standard"]()` |
| Bundle size | ~10 KB gzip | **~1 KB gzip** |

## Performance

Recent stable benchmarks (200k iterations, averaged across 5 runs, vs Zod 3.x):

| case | Valdix | Zod | ratio |
|------|--------|-----|-------|
| string | 3.6M ops/s | 3.8M ops/s | about tied |
| email | 4.0M ops/s | 3.2M ops/s | 1.2-1.8x faster |
| number | 6.6M ops/s | 5.0M ops/s | 1.2-1.5x faster |
| object | 1.1M ops/s | 1.2M ops/s | about tied |
| array | 3.7M ops/s | 1.5M ops/s | 2.5-4.0x faster |
| deep | 770k ops/s | 540k ops/s | 1.3-1.5x faster |

If raw throughput matters more than bundle size, run the comparison yourself:

```bash
cd /tmp/bench && npm i zod@3
node /path/to/valdix/benchmark/compare.mjs
```
