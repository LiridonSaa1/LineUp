---
name: Auth token pattern
description: How JWT auth is wired between frontend and API in this project
---

## Rule
- Token stored in `localStorage` under key `barber_token`
- User object stored in `localStorage` under key `barber_user`
- On AuthProvider mount: call `setAuthTokenGetter(() => localStorage.getItem("barber_token"))` — this hooks into every API call made by Orval-generated hooks
- Backend reads `Authorization: Bearer <token>` header and validates with `SESSION_SECRET` env var

**Why:** Avoids cookie complexity for the Replit proxy environment; works across web and mobile (Expo) with the same pattern.

**How to apply:** Import `setAuthTokenGetter` from `@workspace/api-client-react` (main index) — not from the `/src/custom-fetch` deep path.
