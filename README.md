# Valdix

Zero-dependency **TypeScript-first** schema validation with built-in multi-language support.

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
| Bundle size | ~10KB | ~5KB gzip |

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

v.number().min(0).max(100).int().positive().multipleOf(5)
v.boolean()
v.date()

v.literal("admin")
v.enum(["a", "b", "c"])
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
User.partial()       // all fields optional
User.required()      // all fields required
User.pick(["name"])  // { name: string }
User.omit(["age"])   // { name: string, role: ... }
User.strict()        // rejects unknown keys
```

### Arrays & Tuples

```ts
v.array(v.string()).min(1).max(10)
v.tuple(v.string(), v.number())
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
v.string().optional()     // string | undefined
v.string().nullable()     // string | null
v.string().nullish()      // string | null | undefined
v.string().default("n/a") // undefined → "n/a" at parse time
```

### Transform & Pipe

```ts
const Num = v.string().transform(s => parseInt(s))
Num.parse("42") // → 42 (type: number)

const Slug = v.string().trim().lowercase().pipe(v.string().min(1))
```

### Safe Parse Output

```ts
const r = schema.safeParse(input)
// r.success === true  → r.data
// r.success === false → r.errors: [{ path, message, code }]
//                         → ready to map() in your UI
```

### Multi-Language

```ts
// Global: all errors use Indonesian
v.useLang("id")

// Per-parse
schema.parse(input, { lang: "jp" })
schema.safeParse(input, { lang: "en" })
```

### Available Languages

- **EN** — English (default)
- **ID** — Indonesian (natural daily tone)
- **JP** — Japanese

More languages: `v.registerLocale("fr", { ... })`

## License

MIT
