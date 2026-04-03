## 2026-04-03
- Initial TypeScript diagnostics flagged the missing extension plugin until `npm install` completed.
- Refactoring the quiz formatter exposed stale helper functions in `extractor.ts`; removing them cleared `noUnusedLocals` hints.
- CSS/HTML LSP diagnostics could not run because the configured `biome` server is not installed in this environment, so verification relied on the successful Vite build plus TypeScript typecheck.
- Running CSS/HTML diagnostics in this environment required installing `@biomejs/biome` globally before the LSP checks would pass.
