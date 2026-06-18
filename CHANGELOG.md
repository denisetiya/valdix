# Changelog

## [0.1.0] - 2026-06-18

### Added

- **Core engine** — `Schema<TOutput, TInput>` base class with `parse()`, `safeParse()`, chainable API
- **String schema** — `.min()`, `.max()`, `.length()`, `.email()`, `.url()`, `.uuid()`, `.regex()`, `.startsWith()`, `.endsWith()`, `.includes()`, `.trim()`, `.lowercase()`, `.uppercase()`
- **Number schema** — `.min()`, `.max()`, `.int()`, `.positive()`, `.negative()`, `.finite()`, `.multipleOf()`
- **Boolean, Date, Literal, Enum** primitives
- **Object schema** — deep inference, `.partial()`, `.required()`, `.pick()`, `.omit()`, `.extend()`, `.merge()`, `.strict()`, `.passthrough()`
- **Array schema** — `.min()`, `.max()`, `.length()`, full item validation
- **Tuple schema** — fixed-length typed tuples
- **Union & Intersection** — `.or()`, `.and()`, `v.union()`
- **Discriminated Union** — `v.discriminatedUnion("type", { ... })`
- **Record schema** — key+value validation
- **Modifiers** — `.optional()`, `.nullable()`, `.nullish()`, `.default()`
- **Transform & Pipe** — `.transform()`, `.pipe()` for value transformation
- **Multi-language** — Built-in EN, ID, JP with natural/casual error messages
- **`v.useLang()`** — global language switch
- **Per-parse `{ lang }`** — override language per parse call
- **Zero dependencies** — only TypeScript as devDependency
- **Type inference** — `v.Infer<typeof schema>`, `v.Input<typeof schema>`
- **Error output** — `.safeParse()` returns `{ success, errors: [{ path, message, code }] }`, ready for UI rendering
