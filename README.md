# Valdix

> Schema validation with messages your users can read. Zero dependencies, TypeScript-first, 17 locales, about 1 KB gzipped.

```ts
import v from "@denisetiya/valdix"

const Signup = v.object({
  name: v.string().min(3),
  email: v.string().email(),
  age: v.number().min(18),
})

type Signup = v.Infer<typeof Signup>
// → { name: string; email: string; age: number }

// Switch language. Form errors now read in Indonesian
v.useLang("id")
const r = Signup.safeParse({ name: "", email: "bad", age: 15 })
// r.errors[0].message === "name minimal 3 karakter"
// r.errors[1].message === "Alamat email tidak valid"
// r.errors[2].message === "age minimal 18"
```

## Why Valdix?

| | Zod | Valdix |
|---|---|---|
| TypeScript inference | yes | yes, full |
| Zero deps | yes | yes |
| ESM-first + CJS | partial | yes, both |
| Multi-language | DIY | 17 locales built-in |
| Casual, user-ready error messages | no | end-user tone |
| Smart "required" behavior (`""` → "tidak boleh kosong") | no | yes |
| safeParse output | Complex ZodError | Simple `[{ path, message, code }]` |
| Bundle size (gzipped) | ~13 KB | ~1 KB |
| Locales | DIY | 17 built-in |

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

Per-parse override, custom locales, and custom error maps are supported.

## Smart "required" behavior

A missing object field reports `required`. String schemas also treat empty input as missing, so forms show "tidak boleh kosong" instead of a type error or a min-length error:

```ts
v.useLang("id")
const s = v.string().min(3)

s.safeParse("")        // → "tidak boleh kosong"
s.safeParse(null)      // → "tidak boleh kosong"
s.safeParse(undefined) // → "tidak boleh kosong"
s.safeParse("hi")      // → "minimal 3 karakter"
s.safeParse("hello")   // → valid
```

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

// Character-class validators (v0.4)
v.string().alpha()      // letters only (a-z, A-Z, Unicode)
v.string().numeric()    // digits only (0-9)
v.string().symbol()     // non-alphanumeric only
v.string().phone()      // phone number
v.string().e164()       // strict E.164 (+6281234567890)
v.string().jwt()        // three base64url segments
v.string().mac()        // AA:BB:CC:DD:EE:FF
v.string().semver()     // 1.2.3 with prerelease/build
v.string().creditCard() // Luhn check
v.string().imei()       // 15-digit IMEI with Luhn check
v.string().hash("sha256") // hex digest (md5/sha1/sha256/sha512)
v.string().hex()        // hex with optional 0x
v.string().base64url()  // base64url-encoded
v.string().lowercaseCheck() // must be lowercase
v.string().uppercaseCheck() // must be uppercase
v.string().normalized() // must be NFC-normalized

// String formats
v.string().ip()        // IPv4/IPv6
v.string().ip(4)       // IPv4 only
v.string().cidr()
v.string().base64()
v.string().cuid().cuid2().ulid().nanoid().emoji()
v.string().datetime().date().time()
v.string().nonempty()  // 1 char or more

// Number
v.number().min(0).max(100).int().positive().multipleOf(5)
v.number().lt(50).gt(0).safe().finite()
v.number().nan()        // accept NaN (rejected by default)
v.number().step(5)      // multiple of 5 from 0

// Other primitives
v.boolean()
v.date().min(new Date("2024-01-01")).max(new Date("2024-12-31"))
v.bigint().min(0n).max(100n)
v.literal("admin")
v.enum(["a", "b", "c"])
v.nativeEnum(MyEnum)
v.file().maxSize(1024 * 1024).mime("image/png", /^image\//)
v.templateLiteral(["Hello, ", v.string().min(1), "!"])
v.custom((x): x is string => typeof x === "string")
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
v.tuple(v.string()).restItems(v.number()) // ["a", 1, 2]
```

### Records

```ts
v.record(v.string(), v.number())
v.record(v.string(), v.number()).min(1).max(10)
v.record(v.string(), v.number()).nonempty()
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

// Intersection: 2 or more schemas
v.intersection(A, B)        // A & B
v.intersection(A, B, C)     // A & B & C (variadic)
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
// (map r.errors directly in your UI)
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

Valdix is small (2.8 KB raw, 958 B gzipped; Zod is about 13 KB gzipped). On this repo's dev machine (Ryzen 5 6600H, Node 24), Valdix 0.6.0 leads Zod 3.25 on email, numbers, objects, and arrays, and ties on plain strings. See `benchmark/README.md` for the method, the scripts (`npm run bench`, `npm run bench:compare`), and the full measured tables. Re-run on your hardware before repeating any speed claim.

## Setup

```bash
npm install @denisetiya/valdix
```

## Scripts

```bash
npm run build       # ESM + CJS
npm run typecheck   # tsc --noEmit
npm test            # unit + e2e + CJS tests
npm run bench       # micro-benchmark
npm run size        # bundle size
npm run docs:dev    # docs site (Astro)
npm run docs:build  # build docs to docs/dist
```

## Docs

`docs/` is an Astro site with 6 pages: home, quick start, API, i18n, benchmark, and Zod migration. Markdown guides live in `docs/src/pages/`. Docs dependencies are independent from the library (the library stays zero-dependency).

```bash
npm --prefix docs install  # once: install docs dependencies
npm run docs:dev           # local preview
npm run docs:build         # static output in docs/dist
```

## Release process

The package is published to npm via the Release GitHub Actions workflow. Trigger it manually from the Actions tab.

### Steps

1. Go to Actions → Release → Run workflow
2. Pick the version bump:
   - patch: bug fixes, perf (0.6.0 → 0.6.1)
   - minor: new features, locales (0.6.0 → 0.7.0)
   - major: breaking changes (0.6.0 → 1.0.0)
3. Optional: add a prerelease tag (e.g. `beta`, `rc.1`)
4. Optional: enable dry run to verify build + version bump without publishing
5. Click Run workflow

The workflow will:
- Run typecheck + 229 unit tests + 15 e2e tests + 8 CJS tests
- Run the examples as a consumer smoke test
- Build ESM + CJS + types, plus the docs site
- Verify the new version isn't already on npm
- Bump `package.json` and stamp a CHANGELOG entry
- Publish to npm
- Smoke-test the published package in a clean install
- Commit the version bump + tag, push to `main`
- Create a GitHub release with auto-generated notes

### First-time setup

Add the `NPM_TOKEN` secret to the repo:

```bash
# Get an automation token from https://www.npmjs.com/settings/~/tokens
# (Use "Automation" type for publish)
gh secret set NPM_TOKEN
# paste token when prompted
```

## License

MIT
