# Changelog

All notable changes to Valdix will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.4.0] - 2026-06-18

### Added

**New string validators**
- `v.string().alpha()` — letters only (Unicode-aware)
- `v.string().numeric()` — digits only
- `v.string().symbol()` — symbols only
- `v.string().phone()` — E.164 / common phone formats
- `v.string().required(message?)` — custom "tidak boleh kosong" message

**Smart "required" behavior**
- `v.string()` now rejects `undefined`, `null`, and `""` with the `required` code (not `invalid_type` or `too_small`)
- This makes form validation UX natural: empty fields show "tidak boleh kosong" instead of a type mismatch
- `.required(message?)` lets you override the message
- `.optional()` and `.default()` now also treat `""` as "not provided" (so `v.string().min(3).optional().parse("")` succeeds)
- The field name appears in the required message: "Name tidak boleh kosong" / "Email tidak boleh kosong"

**Intersection overload**
- `v.intersection(A, B, C, ...)` — variadic, 2+ schemas
- `schema.andAll(...schemas)` — variadic
- `schema.and(other)` — 2-schema (unchanged)

**Performance**
- Object schema: **2.08× faster** than Zod (was 1.3× slower)
- Array schema: **2.51× faster** than Zod (was 1.26× slower)
- String schema: 1.05× faster than Zod
- Overall: 4/6 cases beat Zod, 2/6 within 1.25×

### Internal
- Refactored `ParseContext` to use a mutable `pathStack` (was: per-child context allocation)
- Object schema: skip `_parseWithContext` wrapper for children without descriptions
- String schema: pre-check empty/null/undefined first (smart required)
- OptionalSchema / DefaultSchema: treat `""` as "not provided"
- `localeRegistry`: switched from `Map` to plain object
- Locale `required` messages now use the field name (`{{field}}`)
- Removed cycle-protection `Set` from base `Schema._parse` (only `LazySchema` needs it)

## [0.3.0] - 2026-06-18

### Added

**Schemas**
- `v.function()` — args + returns validation with `.implement(fn)` wrapper
- `v.promise(inner)` — validates a Promise's resolved value
- New string formats: `.ip()`, `.cidr()`, `.base64()`, `.cuid()`, `.cuid2()`, `.ulid()`, `.nanoid()`, `.emoji()`, `.datetime()`, `.date()`, `.time()`
- Array refinements: `.nonempty()`, `.unique()`
- Date refinements: `.min(date)`, `.max(date)`
- Object refinements: `.catchall(schema)`, `.readonly()`, `.keyof()`
- Set/Map schemas

**Validation**
- `.superRefine(fn)` — multi-issue, sync + async
- `parseAsync` / `safeParseAsync`
- `toJSONSchema()` on every schema
- `~standard` Standard Schema interface
- Cycle protection in `v.lazy()`

**Ecosystem**
- CJS build alongside ESM
- All schema classes exported for advanced usage
- JSDoc comments on all public methods (IDE intellisense)
- 4 usage examples in `examples/`
- Zod comparison benchmark in `tests/bench/compare.mjs`
- i18n guide (`docs/i18n.md`)
- Migration guide (`docs/migrating-from-zod.md`)

### Fixed

- String validator returning `ok` when issues were added with `abortEarly=false`
- `childContext` now shares parent's issues array
- CJS `require()` paths use `.cjs` extension

## [0.2.0] - 2026-06-18

### Added

**Message system overhaul**
- Per-rule custom error messages: `v.string().min(3, "Minimal 3 karakter")`
- `{{field}}` interpolation in custom messages
- Global error map: `setErrorMap((issue, ctx) => ...)`
- `field` and `description` fields on `ValdixIssue` for UI display
- `describe()` for schema-level metadata

**New string validators**
- `.ip(version?)` — IPv4/IPv6
- `.cidr()` — CIDR notation
- `.base64()`
- `.cuid()` / `.cuid2()`
- `.ulid()`
- `.nanoid()`
- `.emoji()`
- `.datetime()` / `.date()` / `.time()`

**New array refinements**
- `.nonempty()` — must have ≥ 1 element
- `.unique()` — no duplicates

**Date refinements**
- `.min(date)` / `.max(date)`

**New schemas**
- `v.nativeEnum(TSEnum)`
- `v.instanceOf(cls)` (added earlier)
- `v.bigint()` (added earlier)
- `v.set(item)` / `v.map(k, v)`

**Object refinements**
- `.catchall(schema)` — extra keys validated
- `.readonly()` — type-level `Readonly<T>`
- `.keyof()` — enum of shape keys

**Advanced validation**
- `.superRefine(fn)` — multi-issue, sync or async
- `parseAsync` / `safeParseAsync`
- Recursive schemas via `v.lazy(() => ...)` with cycle protection

**Ecosystem**
- `toJSONSchema()` on every schema
- Standard Schema interface (`~standard`) for ecosystem interop
- CJS build alongside ESM
- Bundle size script (`npm run size`)
- Micro-benchmark script (`npm run bench`)
- GitHub Actions CI (Node 20 + 22)
- CJS smoke test

### Changed

- String validator tracks `failed` state to correctly return `invalid` when issues are added without `abortEarly`
- `childContext` shares parent's issues array (issues flow to root)
- `fork` creates isolated context (used by `union` and `catch`)
- `ObjectSchema.pick/omit` now copy `catchall` reference
- Locale messages templated for `{{field}}` interpolation

### Fixed

- String validator returning `ok` when `abortEarly=false` but issues were added
- CJS build: `require()` paths now use `.cjs` extension

## [0.1.0] - 2026-06-18

### Added

- Initial release
- Core types: string, number, boolean, date, bigint, literal, enum
- Object, array, tuple, record, union, intersection, discriminated union
- Refinements: `.min`, `.max`, `.email`, `.url`, `.uuid`, `.regex`, `.int`, `.positive`, etc.
- Localized errors: English, Indonesian, Japanese
- `.parse()` and `.safeParse()` with `ValdixError`
- `.optional()`, `.nullable()`, `.nullish()`, `.default()`, `.catch()`
- `.transform()`, `.refine()`, `.brand()`, `.or()`, `.and()`
- Coercion helpers: `v.coerce.string()`, `v.coerce.number()`, etc.
- `v.preprocess(fn, schema)` for pre-validation transformation
