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

// Valdix — identical
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

// Valdix — flatter, ready for UI
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

Valdix ships three locales (en/id/jp) out of the box. Add your own with `v.registerLocale(lang, catalog)`.

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
| Bundle size | ~10 KB gzip | **~550 B gzip** |

## Performance

Valdix is in the same ballpark as Zod (within ~1.2-1.8× in our benchmarks). Zod has had more time to optimize hot paths. If raw throughput matters more than bundle size, Zod may edge ahead; if bundle size or i18n matters, Valdix is the better pick.

Run the comparison yourself:

```bash
cd /tmp/bench && npm i zod@3
node /path/to/valdix/tests/bench/compare.mjs
```
