# Valdix

Zero-dependency **TypeScript-first** schema validation with built-in multi-language support and casual, end-user-ready error messages.

```ts
import v from "valdix"

const User = v.object({
  name: v.string().min(2),
  email: v.string().email(),
  age: v.number().min(18),
})

// Type inference — same power as Zod
type User = v.Infer<typeof User>
// → { name: string; email: string; age: number }

// Parse with localized error messages
const result = User.safeParse({ name: "Eki", email: "bad", age: 15 })
// → { success: false, errors: [{ field: "email", message: "Alamat email tidak valid", code: "invalid_string" }] }

// Switch language
v.useLang("id")
User.parse(input) // errors in Indonesian

// Per-parse override
User.safeParse(input, { lang: "jp" })
```

## Why Valdix?

| Feature | Zod | Valdix |
|---------|-----|--------|
| Multi-language | ❌ | ✅ Built-in EN/ID/JP |
| Casual error messages | ❌ Developer-oriented | ✅ End-user ready |
| safeParse output | Complex ZodError | Simple array `{ path, message, code }` |
| Zero deps | ✅ | ✅ |
| ESM-first | Partial | ✅ First-class |
| CJS support | ✅ | ✅ |
| Standard Schema | ✅ | ✅ |
| Bundle size | ~10KB | **~550B** gzip |

## Setup

```bash
npm install valdix
```

## API

### Primitives

```ts
v.string()
v.string().min(3).max(50).email().url().uuid()
v.string().trim().lowercase().uppercase()
v.string().startsWith("api_").endsWith("_v1").includes("foo")

// String formats
v.string().ip()            // IPv4 or IPv6
v.string().ip(4)           // IPv4 only
v.string().cidr()          // CIDR
v.string().base64()
v.string().cuid().cuid2()
v.string().ulid()
v.string().nanoid()
v.string().emoji()
v.string().datetime().date().time()
v.string().nonempty()      // ≥ 1 char

v.number().min(0).max(100).int().positive().multipleOf(5)
v.number().lt(50).gt(0).safe().finite()
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
User.partial()        // all fields optional
User.required()       // all fields required
User.required(["name"]) // only these required
User.pick(["name"])   // { name: string }
User.omit(["age"])    // { name: string, role: ... }
User.strict()         // rejects unknown keys
User.passthrough()    // keeps unknown keys
User.catchall(v.string()) // unknown keys validated as string
User.keyof()          // enum of shape keys
User.readonly()       // type-level Readonly<>
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
v.string().or(v.number()) // same
v.object({ a: v.string() }).and(v.object({ b: v.number() }))
```

### Discriminated Union

```ts
const Event = v.discriminatedUnion("type", {
  click: v.object({ type: v.literal("click"), x: v.number(), y: v.number() }),
  keypress: v.object({ type: v.literal("keypress"), key: v.string() }),
})
```

### Modifiers

```ts
v.string().optional()      // string | undefined
v.string().nullable()      // string | null
v.string().nullish()       // string | null | undefined
v.string().default("n/a")  // undefined → "n/a" at parse time
v.string().catch("fallback") // on fail, return fallback
v.string().brand("UserId") // branded type
v.string().readonly()      // Readonly<T>
```

### Refinements & SuperRefine

```ts
v.string().refine(s => s.length > 0, "Must be non-empty")
v.string().superRefine((val, ctx) => {
  if (val.length < 8) ctx.addIssue({ code: "custom", message: "Min 8 chars" });
  if (!/[A-Z]/.test(val)) ctx.addIssue({ code: "custom", message: "Need uppercase" });
})
v.string().refine(async s => await checkServer(s)) // async
```

### Transform & Pipe

```ts
const Num = v.string().transform(s => parseInt(s))
Num.parse("42") // → 42 (type: number)

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

### Multi-Language

```ts
// Global: all errors use Indonesian
v.useLang("id")

// Per-parse
schema.parse(input, { lang: "jp" })
schema.safeParse(input, { lang: "en" })

// Custom locale
v.registerLocale("fr", {
  required: () => "Ce champ est requis",
  too_small: (i) => `Doit contenir au moins ${i.minimum} caractères`,
  // ... other codes
})
```

### Available Languages

- **EN** — English (default)
- **ID** — Indonesian (natural daily tone)
- **JP** — Japanese

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
