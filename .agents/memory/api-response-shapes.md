---
name: API response shapes
description: Some endpoints return arrays directly, others return paginated objects — know which is which
---

## Rule
`ListTopBarbershopsResponse` and any endpoint with `Response = z.array(...)` in the Zod schema returns an **array directly**, not `{ data: [], total: N }`.

Endpoints that return paginated objects (with `data` and `total`): listBarbershops, listAppointments, listProducts, listOrders, listPayments, listUsers, listNotifications.

**Endpoints confirmed to return raw arrays:** listTopBarbershops, listBarbers (per shop), listServices (per shop).

**Why:** The OpenAPI spec defines top-shops, barbers, and services as simple arrays (no pagination needed), while list endpoints include pagination wrappers.

**How to apply:** Before calling `.data.map()` on a hook result, check if the schema is `z.array(...)` or `z.object({ data: z.array(...) })`. Use `Array.isArray(result) ? result : result?.data ?? []` as a safe guard. In BarbershopDetail, `useListBarbers` and `useListServices` both return raw arrays — use `Array.isArray(barbersRes)` check, not `barbersRes?.data`.
