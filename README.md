# Valdix

> **Multi-language validation for the next billion users.**
> Zero-dependency, TypeScript-first, casual error messages your end-users will actually understand. **17 locales, ~1 KB gzipped, faster than Zod on most workloads.**

```ts
import v from "valdix"

const Signup = v.object({
  name: v.string().min(3),
  email: v.string().email(),
  age: v.number().min(18),
})

type Signup = v.Infer<typeof Signup>
// → { name: string; email: string; age: number }

// Switch language — your form errors now read in Indonesian
v.useLang("id")
const r = Signup.safeParse({ name: "", email: "bad", age: 15 })
// r.errors[0].message === "name minimal 3 karakter"
// r.errors[1].message === "Alamat email tidak valid"
// r.errors[2].message === "age minimal 18"
```

## Why Valdix?

| | Zod | Valdix |
|---|---|---|
| **TypeScript inference** | ✅ | ✅ Full |
| **Zero deps** | ✅ | ✅ |
| **ESM-first + CJS** | Partial | ✅ Both |
| **Multi-language** | ❌ DIY | ✅ **17 locales built-in** |
| **Casual, user-ready error messages** | ❌ | ✅ End-user tone |
| **Smart "required" behavior** (`""` → "tidak boleh kosong") | ❌ | ✅ |
| **safeParse output** | Complex ZodError | Simple `[{ path, message, code }]` |
| **Bundle size (gzipped)** | ~13 KB | **~1 KB** |
| **Array parse** | 1.5M ops/s | **3.7M ops/s** (2.5× faster) |
| **Deep object parse** | 540k ops/s | **770k ops/s** (1.4× faster) |

## 17 Built-in Locales

```ts
v.useLang("id")  // Bahasa Indonesia
v.useLang("jp")  // 日本語
v.useLang("zh")  // 简体中文
v.useLang("zh-TW") // 繁體中文
v.useLang("ko")  // 한국어
v.useLang("fr")  // Français
v.useLang("pt")  // Português
v.useLang("nl")  // Nederlands
v.useLang("es")  // Español
v.useLang("de")  // Deutsch
v.useLang("ar")  // العربية
v.useLang("ru")  // Русский
v.useLang("it")  // Italiano
v.useLang("vi")  // Tiếng Việt
v.useLang("hi")  // हिन्दी
v.useLang("th")  // ไทย
v.useLang("en")  // English (default)
```

Per-parse override, custom locales, custom error maps — all supported.

## Smart "required" behavior

When a field is required, empty/null/undefined produces a friendly "tidak boleh kosong" message instead of a type error or min-length error:

```ts
v.useLang("id")
const s = v.string().min(3)

s.safeParse("")        // → "tidak boleh kosong"
s.safeParse(null)      // → "tidak boleh kosong"
s.safeParse(undefined) // → "tidak boleh kosong"
s.safeParse("hi")      // → "minimal 3 karakter"
s.safeParse("hello")   // → ✅
```

Apply this to **all** schema types: string, number, array, object.

## API

### Primitives

```ts
// String
v.string()
v.string().min(3).max(50).length(10)
v.string().email().url().uuid()
v.string().trim().lowercase().uppercase()
v.string().startsWith("api_").endsWith("_v1").includes("foo")
v.string().regex(/^\d+$/)

// New in v0.4: character-class validators
v.string().alpha()      // letters only (a-z, A-Z, Unicode)
v.string().numeric()    // digits only (0-9)
v.string().symbol()     // non-alphanumeric only
v.string().phone()      // phone number

// String formats
v.string().ip()        // IPv4/IPv6
v.string().ip(4)       // IPv4 only
v.string().cidr()
v.string().base64()
v.string().cuid().cuid2().ulid().nanoid().emoji()
v.string().datetime().date().time()
v.string().nonempty()  // ≥ 1 char

// Number
v.number().min(0).max(100).int().positive().multipleOf(5)
v.number().lt(50).gt(0).safe().finite()

// Other primitives
v.boolean()
v.date().min(new Date("2024-01-01")).max(new Date("2024-12-31"))
v.bigint()
v.literal("admin")
v.enum(["a", "b", "c"])
v.nativeEnum(MyEnum)
```

### Objects

```ts
const User = v.object({
  name: v.string(),
  age: v.number().optional(),
  role: v.enum(["admin", "user"]).default("user"),
})

User.parse({ name: "Eki" })
// → { name: "Eki", age: undefined, role: "user" }

// Utilities
User.partial()           // all fields optional
User.required()          // all fields required
User.required(["name"])  // only these required
User.pick(["name"])      // { name: string }
User.omit(["age"])       // { name: string, role: ... }
User.strict()            // rejects unknown keys
User.passthrough()       // keeps unknown keys
User.catchall(v.string())// unknown keys validated as string
User.keyof()             // enum of shape keys
User.readonly()          // type-level Readonly<>
User.extend({ role: v.string() })
User.merge(other)
```

### Arrays & Tuples

```ts
v.array(v.string()).min(1).max(10)
v.array(v.string()).nonempty()
v.array(v.string()).unique()
v.tuple(v.string(), v.number())
```

### Sets & Maps

```ts
v.set(v.string())
v.map(v.string(), v.number())
```

### Unions & Intersections

```ts
v.union([v.string(), v.number()])
v.string().or(v.number())   // same

// Intersection — 2 or more schemas
v.intersection(A, B)        // A & B
v.intersection(A, B, C)     // A & B & C — variadic!
A.and(B).and(C)             // chainable equivalent
```

### Discriminated Union

```ts
const Event = v.discriminatedUnion("type", {
  click:    v.object({ type: v.literal("click"),    x: v.number(), y: v.number() }),
  keypress: v.object({ type: v.literal("keypress"), key: v.string() }),
})
```

### Modifiers

```ts
v.string().optional()       // string | undefined
v.string().nullable()       // string | null
v.string().nullish()        // string | null | undefined
v.string().default("n/a")   // undefined → "n/a" at parse time
v.string().catch("fallback")// on fail, return fallback
v.string().brand("UserId")  // branded type
v.string().readonly()       // Readonly<T>
```

### Refinements & SuperRefine

```ts
v.string().refine(s => s.length > 0, "Must be non-empty")

v.string().superRefine((val, ctx) => {
  if (val.length < 8) ctx.addIssue({ code: "custom", message: "Min 8 chars" });
  if (!/[A-Z]/.test(val)) ctx.addIssue({ code: "custom", message: "Need uppercase" });
})

v.string().refine(async s => await checkServer(s))  // async
```

### Transform & Pipe

```ts
const Num = v.string().transform(s => parseInt(s))
Num.parse("42")  // → 42 (type: number)

const Slug = v.string().trim().lowercase().pipe(v.string().min(1))
```

### Coercion & Preprocess

```ts
v.coerce.string()  // input → String(input)
v.coerce.number()  // input → Number(input)
v.coerce.boolean()
v.coerce.bigint()
v.coerce.date()

v.preprocess(v => JSON.parse(v), v.object({ x: v.number() }))
```

### Recursive

```ts
type Category = { name: string; children?: Category[] }
const Category = v.lazy(() => v.object({
  name: v.string(),
  children: v.array(Category).optional(),
}))
```

### Safe Parse Output

```ts
const r = schema.safeParse(input)
// r.success === true  → r.data
// r.success === false → r.errors: [{ path, message, code, field, description }]
//                         → ready to map() in your UI
```

### Custom Error Messages

```ts
// Per-rule
v.string().min(3, "Minimal 3 karakter ya")
v.string().email("Email gak valid")
v.string().regex(/^\d+$/, "Harus angka")

// {{field}} interpolation
v.object({
  userName: v.string().min(3, "{{field}} minimal 3 karakter"),
})
// → "user name minimal 3 karakter"

// Global error map
v.setErrorMap((issue, ctx) => `[${issue.code}] ${ctx.defaultError}`)

// Field-level description (UI hint)
v.string().email().describe("Email address")
// → issue.description === "Email address", issue.field === "email"
```

### Custom Locales

```ts
v.registerLocale("fr", {
  required: () => "Ce champ est requis",
  too_small: (i) => `Doit contenir au moins ${i.minimum} caractères`,
  // ... other codes
})
```

### JSON Schema

```ts
v.object({ name: v.string().min(1), age: v.number().int() }).toJSONSchema()
// → { type: "object", properties: { name: { type: "string", minLength: 1 }, age: { type: "integer" } }, required: ["name", "age"] }
```

### Standard Schema

```ts
const schema = v.object({ name: v.string() })
const std = schema["~standard"]()
const r = std.validate({ name: "x" })
// r is { value: ... } or { issues: [...] }
```

## Performance

Stable benchmark (200k iterations, averaged across 5 runs) vs Zod 3.x:

| case    | Valdix       | Zod          | ratio                |
|---------|--------------|--------------|----------------------|
| string  | 3.6M ops/s   | 3.8M ops/s   | ≈ tied               |
| email   | 4.0M ops/s   | 3.2M ops/s   | **1.2–1.8× faster**  |
| number  | 6.6M ops/s   | 5.0M ops/s   | **1.2–1.5× faster**  |
| object  | 1.1M ops/s   | 1.2M ops/s   | ≈ tied               |
| array   | 3.7M ops/s   | 1.5M ops/s   | **2.5–4.0× faster**  |
| deep    | 770k ops/s   | 540k ops/s   | **1.3–1.5× faster**  |

Bundle: **2.8 KB raw, 967 B gzipped** (vs Zod's ~13 KB gzipped — 13× smaller).

## Setup

```bash
npm install valdix
```

## Scripts

```bash
npm run build       # ESM + CJS
npm run typecheck   # tsc --noEmit
npm test            # ESM + CJS tests
npm run bench       # micro-benchmark
npm run size        # bundle size
```

## License

MIT
