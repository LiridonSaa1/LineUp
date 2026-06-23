---
name: API response shapes
description: Some endpoints return arrays directly, others return paginated objects — know which is which
---

## Rule
`ListTopBarbershopsResponse` and any endpoint with `Response = z.array(...)` in the Zod schema returns an **array directly**, not `{ data: [], total: N }`.

Endpoints that return paginated objects (with `data` and `total`): listBarbershops, listAppointments, listProducts, listOrders, listPayments, listUsers, listNotifications.

**Why:** The OpenAPI spec defines top-shops as a simple array (no pagination needed), while list endpoints include pagination wrappers.

**How to apply:** Before calling `.data.map()` on a hook result, check if the schema is `z.array(...)` or `z.object({ data: z.array(...) })`. Use `Array.isArray(result) ? result : result?.data ?? []` as a safe guard.
