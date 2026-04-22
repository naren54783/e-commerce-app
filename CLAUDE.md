# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Assistant boundaries

- **Do not read `.env`.** It contains secrets. If a config value is needed, infer it from `src/config/*.ts`, ask the user, or reference the variable name without its value.

## Commands

| Task | Command |
|------|---------|
| Dev server (auto-runs `docker compose up -d` via `predev`) | `npm run dev` |
| Build to `dist/` | `npm run build` |
| Run production build | `npm start` |
| Run all tests | `npm test` |
| Run a single test file | `npx jest __tests__/unit/product.service.test.ts` |
| Run tests matching a name | `npx jest -t "duplicate"` |
| Seed 10,000 products | `npm run seed` |

The server requires a `.env` with PostgreSQL connection vars (`POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`, `POSTGRES_HOST`, `POSTGRES_PORT`) and `JWT_SECRET`. `JWT_SECRET` is loaded in `src/config/auth.ts` and throws on startup if missing. `JWT_EXPIRES_IN` is in seconds (default 900 = 15 min); refresh token lifetime is hard-coded to 7 days.

Tables are auto-created on startup via `sequelize.sync()` in `src/config/db.ts` — there are no migrations.

Jest is configured (`jest.config.ts`) with `ts-jest`, `testMatch: **/__tests__/**/*.test.ts`, and `setupFiles: ["dotenv/config"]`, so integration tests read the same `.env` as the server.

## Architecture

Strict layered architecture — each layer only talks to its direct neighbor:

```
Routes → Middleware → Controllers → Services → Repositories → Sequelize/Postgres
```

Controllers never touch the database; repositories never send HTTP responses. When adding a feature, create the file in each layer rather than shortcutting across them.

### Cross-cutting patterns to preserve

- **Zod as single source of truth** — `validators/*.validator.ts` schemas produce both the runtime validation (via the `validate(schema)` middleware factory in `src/middleware/validate.ts`) and the TypeScript DTO (`type ProductData = z.infer<typeof createProductSchema>`). Do not define a parallel TS interface for request bodies.
- **DTO vs Entity split** — `ProductData` (client input) is distinct from `IProduct` (DB entity with `id`, `createdAt`, `updatedAt`). Do not accept entity fields on create/update endpoints.
- **Typed error hierarchy** — Services throw `ConflictError`, `AuthenticationError`, `NotFoundError`, `ValidationError` from `src/errors/app-error.ts`. The global `errorHandler` maps them to HTTP codes via `instanceof`. Never use string matching on error messages, and never throw raw `Error` from services.
- **Repository pattern** — All Sequelize calls live in `src/repositories/`. Services must not import Sequelize models directly. This is the seam unit tests mock.

### Auth flow (dual-token with rotation)

- Access token (JWT, 15 min default) → sent as `Authorization: Bearer <token>` on every request, validated by `middleware/auth.ts`.
- Refresh token (opaque, 7 days) → stored in the `refresh_tokens` table. `/auth/refresh` is **single-use**: the old row is deleted and a new pair is issued. `/auth/logout` deletes the row.
- Registration is hard-coded to `role: "customer"` in the Zod schema to prevent privilege escalation via the API — do not loosen this.

### Route mounting

Both `userRoutes` and `productRoutes` are mounted at `/api` in `src/app.ts`. The path prefix (`/auth`, `/products`) is defined inside each route file, not at mount time.

### Security invariants (don't regress)

- `express.json()` / `express.urlencoded()` are capped at `10kb`.
- `orderby` on `GET /products` is validated against a whitelist — never pass user input straight to Sequelize `order`.
- `search` is truncated to 100 chars.
- User `password` is excluded from `findById` queries and all API responses.
- bcrypt salt rounds = 10.

## Testing strategy

- `__tests__/unit/` — validators and services; the repository is mocked.
- `__tests__/integration/` — full route via Supertest; repository is mocked (routes, middleware, controller, service are real).
- There is no end-to-end test that hits Postgres; integration tests do **not** require the Docker DB to be running.
