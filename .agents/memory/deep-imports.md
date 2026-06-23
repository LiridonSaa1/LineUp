---
name: Deep imports blocked
description: @workspace/api-client-react only exports the main index; deep paths like /src/custom-fetch are blocked by package.json exports
---

## Rule
`@workspace/api-client-react/package.json` has `"exports": { ".": "./src/index.ts" }`.

This means any deep import like `@workspace/api-client-react/src/custom-fetch` will fail with "Missing specifier" at Vite build time.

**Why:** Package exports field is intentionally minimal — all public API surfaces through the main index.

**How to apply:** Always check the `exports` field in a lib's package.json before using a deep import path. If a function isn't re-exported from the main index, add it there rather than using a deep path.
