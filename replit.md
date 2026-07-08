# LineUp - Barber Booking System

Kosovo's premium barbershop booking platform — find shops, book appointments with OTP confirmation, buy grooming products.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm --filter @workspace/scripts run seed` — seed the database with demo data
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string (auto-provisioned by Replit)

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5, JWT auth (jsonwebtoken + bcryptjs)
- DB: PostgreSQL + Drizzle ORM
- Frontend: React + Vite, TanStack Query, Wouter routing, Tailwind CSS + shadcn/ui
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec at `lib/api-spec/openapi.yaml`)
- Build: esbuild (CJS bundle)

## Where things live

- `lib/api-spec/openapi.yaml` — OpenAPI spec (source of truth for API contract)
- `lib/db/src/schema/` — Drizzle schema files (users, barbershops, barbers, services, appointments, products, orders, payments, notifications, activity)
- `lib/api-client-react/src/generated/` — Generated React Query hooks
- `lib/api-zod/src/generated/` — Generated Zod schemas for backend validation
- `artifacts/api-server/src/routes/` — Express route handlers
- `artifacts/api-server/src/lib/auth.ts` — JWT middleware, bcrypt helpers, OTP generator
- `artifacts/web/src/` — React frontend (pages, components, layouts)
- `scripts/src/seed.ts` — Database seed with Kosovo barbershops demo data

## Architecture decisions

- Contract-first: OpenAPI spec drives both frontend hooks (Orval) and backend Zod validation
- JWT stored in `localStorage` under key `barber_token`; `setAuthTokenGetter` wires it into every API call
- OTP confirmation flow: booking creates appointment with `pending_otp` status + 6-digit OTP (15 min expiry); POST `/api/appointments/:id/confirm-otp` confirms it
- Stripe integration gracefully degrades when `STRIPE_SECRET_KEY` is absent (returns 503)
- Available slots are computed on-the-fly from existing confirmed appointments (no slot table)

## Product

- **Home**: City search + top-rated barbershops grid
- **Barbershop Discovery**: Paginated list with search/filter, shop detail with services + team
- **Booking Wizard**: 3-step flow — pick service/barber → pick date/time → confirm with OTP
- **Owner Dashboard**: Stats, appointments, barbers, services, products, subscription management
- **Admin Dashboard**: Global stats, shop approvals, user management
- **Marketplace**: Products from all shops, add to cart, Stripe checkout
- **Notifications**: Real-time booking and order notifications

## Demo accounts (after seeding)

| Role  | Email                     | Password  |
|-------|---------------------------|-----------|
| Admin | admin@lineup.com      | admin123  |
| Owner | artan@lineup.com      | owner123  |
| User  | besim@gmail.com           | user123   |

## Pending integrations (add keys to activate)

- `STRIPE_SECRET_KEY` + `STRIPE_PUBLISHABLE_KEY` + `STRIPE_WEBHOOK_SECRET` — payments
- `BREVO_API_KEY` — email notifications (OTP delivery, booking confirmations)
- `GOOGLE_MAPS_API_KEY` — map view for barbershop discovery

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- `pnpm run typecheck:libs` may timeout in shell; use `npx orval` directly for codegen
- Available-slots endpoint is a query-param only route: `/api/available-slots?shopId=&barberId=&date=`
- Always run `pnpm --filter @workspace/db run push` after schema changes
- `ListTopBarbershopsResponse` is an array (not `{ data: [] }`) — use `Array.isArray()` guard when consuming

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
