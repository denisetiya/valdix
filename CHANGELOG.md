# Changelog

All notable changes to Valdix will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
