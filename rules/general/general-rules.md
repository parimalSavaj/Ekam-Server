# General Rules

- Use TypeScript strict mode.
- No `any` type — use proper typing or `unknown` if type is uncertain.
- Target ES2022 and use native ESM with `"type": "module"` in `package.json`. Set both `module` and `moduleResolution` to `NodeNext`.
- Write relative imports with emitted `.js` extensions, including explicit `/index.js` for directory imports. Use `import type` for type-only dependencies with `verbatimModuleSyntax` enabled.
- Use `import.meta.url` and Node's URL APIs for module-relative paths instead of CommonJS `__dirname` or `require`. Older examples in other rule documents illustrate layering; apply these ESM import conventions to actual code.
- All config values come from `src/shared/config/index.ts` — never read `process.env` directly elsewhere.
- Use the `LoggerService` for all logging — no `console.log` in production code.
- **Use normal dash (`-`) in all code** — error messages, log messages, comments, and string literals must use a normal hyphen-minus (`-`), never an em dash (`—`) or en dash (`–`). Em dashes are only acceptable in markdown documentation files (`.md`), never in `.ts` source files.

## After Every Change

After making any code change — moving files, updating imports, refactoring, adding new files — always run:

```bash
npx tsc --noEmit
```

This must pass with zero errors before the change is considered done. Never leave broken imports or type errors behind.
