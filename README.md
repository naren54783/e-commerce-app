# E-Commerce API

A RESTful API for an electronics e-commerce platform built with Express 5, TypeScript, Sequelize, and Zod validation.

## Architecture

The project follows a **layered architecture** with clear separation of concerns:

```
Request
  |
  v
Routes          - Endpoint definitions + middleware wiring
  |
  v
Middleware      - CORS, Zod validation, JWT auth, error handling
  |
  v
Controllers    - Parse request params, call services, send responses
  |
  v
Services       - Business logic (duplicate checks, token generation, etc.)
  |
  v
Repositories   - Database queries via Sequelize
  |
  v
Models         - Schema definitions + TypeScript interfaces
```

Each layer only communicates with its direct neighbor. Controllers never touch the database. Repositories never send HTTP responses.

## Design Patterns

### Repository Pattern

`repositories/product.repository.ts` abstracts all database access behind functions like `findAll`, `findById`, `create`. The service layer never writes Sequelize queries directly. If you swap Sequelize for Prisma or MongoDB, only the repository changes — everything above it stays the same.

```
Service  -->  Repository  -->  Sequelize  -->  PostgreSQL
                  ^
          Only this layer
          knows about the DB
```

### Middleware Pattern (Chain of Responsibility)

Express middleware forms a pipeline where each step decides to either handle the request or pass it to the next. The Zod validation middleware short-circuits with 400 before the controller ever runs.

```
Request --> cors --> json --> authenticate --> validate(schema) --> controller --> errorHandler --> Response
                                  |                 |                                  ^
                                  |-- 401           |-- 400 (invalid)                  |
                                  |-- next()        |-- next() (valid) --> ... --> next(error)
```

### Factory Pattern

`validate(schema)` in `middleware/validate.ts` is a factory — it takes a Zod schema and **produces** a middleware function. One factory, multiple schemas:

```ts
validate(createProductSchema)      // produces middleware for single product
validate(createBulkProductSchema)  // produces middleware for bulk products
validate(registerSchema)           // produces middleware for user registration
validate(loginSchema)              // produces middleware for login
validate(refreshSchema)            // produces middleware for token refresh
validate(logoutSchema)             // produces middleware for logout
```

### Custom Error Classes (AppError Hierarchy)

A typed error hierarchy replaces brittle string matching in the error handler:

```
AppError (base — carries statusCode)
  ├── ConflictError      (409)
  ├── AuthenticationError (401)
  ├── NotFoundError       (404)
  └── ValidationError     (400)
```

Services throw specific error classes. The global error handler uses `instanceof` to map them to HTTP status codes — no string comparisons needed.

```ts
// Service throws a typed error
throw new ConflictError("Email already registered");

// Error handler catches by type
if (err instanceof AppError) {
  res.status(err.statusCode).json({ message: err.message });
}
```

### DTO Pattern (Data Transfer Object)

Two separate types enforce the boundary between what clients send and what the database stores:

| Type          | Purpose                    | Fields                                          |
|---------------|----------------------------|-------------------------------------------------|
| `ProductData` | Client input (create/update) | `name`, `price`, `quantity`, ...               |
| `IProduct`    | Full database entity        | `ProductData` + `id`, `createdAt`, `updatedAt` |

Clients never send `id` or timestamps. The API never accepts fields it doesn't expect.

### Single Source of Truth

The Zod schema generates both runtime validation and the TypeScript type via `z.infer`. The type and validation rules can never drift apart — one definition serves two purposes.

```ts
// Schema defines validation rules
export const createProductSchema = z.object({
  name: z.string().min(1),
  price: z.number().positive(),
  ...
});

// Type is derived from the schema — always in sync
export type ProductData = z.infer<typeof createProductSchema>;
```

### Layered (N-Tier) Architecture

Each layer has a single responsibility:

| Layer        | Responsibility                     | Knows about          |
|--------------|------------------------------------|----------------------|
| Routes       | URL mapping + middleware wiring    | Controllers          |
| Middleware   | Cross-cutting concerns             | Request/Response     |
| Controllers  | HTTP parsing + response formatting | Services             |
| Services     | Business rules + orchestration     | Repositories         |
| Repositories | Data access + query building       | Database (Sequelize) |

No layer skips its neighbor. This makes each layer independently testable and replaceable.

## Project Structure

```
.
├── server.ts                 # Entry point — loads env, connects DB, starts server
├── app.ts                    # Express app — CORS, body parsing, routes, error handler
├── config/
│   ├── db.ts                 # Sequelize connection + sync
│   └── auth.ts               # JWT secret + token expiry config
├── errors/
│   └── app-error.ts          # Custom error classes (AppError, ConflictError, etc.)
├── models/
│   ├── product.model.ts      # Product Sequelize model + IProduct interface
│   ├── user.model.ts         # User Sequelize model + IUser interface
│   └── refresh-token.model.ts # RefreshToken model (token rotation)
├── validators/
│   ├── product.validator.ts  # Zod schemas + ProductData type
│   └── user.validator.ts     # Register, login, refresh, logout Zod schemas
├── middleware/
│   ├── validate.ts           # Generic Zod validation middleware factory
│   ├── auth.ts               # JWT authentication middleware
│   └── error-handler.ts      # Global error handler (AppError-based)
├── controllers/
│   ├── product.controller.ts # Product request handlers
│   └── user.controller.ts    # Auth request handlers
├── services/
│   ├── product.services.ts   # Product business logic
│   └── user.services.ts      # Auth business logic (register, login, refresh, logout)
├── repositories/
│   ├── product.repository.ts # Product database queries
│   ├── user.repository.ts    # User database queries
│   └── refresh-token.repository.ts # Refresh token CRUD
├── routes/
│   ├── product.routes.ts     # Product route definitions
│   └── user.routes.ts        # Auth route definitions
├── seed-data/
│   └── product.seed.ts       # Generates 10,000 realistic products
├── __tests__/
│   ├── unit/
│   │   ├── product.validator.test.ts
│   │   └── product.service.test.ts
│   └── integration/
│       └── product.routes.test.ts
├── docker-compose.yml        # PostgreSQL container
├── jest.config.ts
├── tsconfig.json
└── package.json
```

## Tech Stack

| Layer        | Technology     |
|--------------|----------------|
| Runtime      | Node.js >= 20  |
| Language     | TypeScript 5   |
| Framework    | Express 5      |
| Database     | PostgreSQL 16  |
| ORM          | Sequelize 6    |
| Validation   | Zod 4          |
| Auth         | JWT + bcrypt   |
| CORS         | cors           |
| Testing      | Jest + Supertest |
| Seeding      | Faker.js       |

## Getting Started

### Prerequisites

- Node.js >= 20
- Docker (for PostgreSQL) or a local PostgreSQL instance

### Setup

1. Clone the repository

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start PostgreSQL:
   ```bash
   docker compose up -d
   ```

4. Create a `.env` file:
   ```
   POSTGRES_USER=postgres
   POSTGRES_PASSWORD=postgres
   POSTGRES_DB=ecommerce
   POSTGRES_PORT=5432
   POSTGRES_HOST=localhost
   PORT=3000
   JWT_SECRET=your_secret_key_here
   JWT_EXPIRES_IN=900
   ```

   `JWT_SECRET` is **required** — the server will throw on startup if it is missing.

5. Start the development server:
   ```bash
   npm run dev
   ```
   The server will auto-create tables on startup via `sequelize.sync()`.

6. (Optional) Seed the database with 10,000 products:
   ```bash
   npx ts-node seed-data/product.seed.ts
   ```

## API Endpoints

Base URL: `http://localhost:3000/api`

### Authentication

#### Register

```
POST /auth/register
```

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securepass123"
}
```

| Status | Description               |
|--------|---------------------------|
| 201    | User created (password excluded from response) |
| 400    | Validation failed         |
| 409    | Email already registered  |

Note: The `role` field defaults to `"customer"` and only accepts `"customer"` via the API to prevent privilege escalation.

#### Login

```
POST /auth/login
```

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "securepass123"
}
```

**Response:**
```json
{
  "user": { "id": "uuid", "name": "John Doe", "email": "john@example.com", "role": "customer" },
  "accessToken": "eyJhbG...",
  "refreshToken": "a1b2c3d4e5..."
}
```

| Status | Description               |
|--------|---------------------------|
| 200    | Login successful          |
| 400    | Validation failed         |
| 401    | Invalid email or password |

#### Refresh Token

```
POST /auth/refresh
```

**Request Body:**
```json
{
  "refreshToken": "a1b2c3d4e5..."
}
```

**Response:**
```json
{
  "accessToken": "eyJhbG...(new)",
  "refreshToken": "f6g7h8i9...(new)"
}
```

| Status | Description               |
|--------|---------------------------|
| 200    | New token pair issued     |
| 400    | Validation failed (missing refreshToken) |
| 401    | Invalid or expired refresh token |

#### Logout

```
POST /auth/logout
```

**Request Body:**
```json
{
  "refreshToken": "a1b2c3d4e5..."
}
```

| Status | Description               |
|--------|---------------------------|
| 200    | Logged out, refresh token deleted |
| 400    | Validation failed (missing refreshToken) |

### Authentication Flow

The API uses a **dual-token strategy** with token rotation:

```
1. Login  ──>  receive accessToken (15 min) + refreshToken (7 days)

2. API calls  ──>  send accessToken in Authorization header
   Authorization: Bearer <accessToken>

3. Token expires  ──>  POST /auth/refresh with refreshToken
   ──>  receive NEW accessToken + NEW refreshToken
        (old refresh token is deleted — single use)

4. Logout  ──>  POST /auth/logout with refreshToken
   ──>  refresh token deleted from DB (immediate invalidation)
```

**Why two tokens?**

| | Access Token | Refresh Token |
|---|---|---|
| **Lifetime** | 15 minutes | 7 days |
| **Storage** | Client memory | Database + client |
| **Sent with** | Every API request | Only `/auth/refresh` |
| **Revocable?** | No (stateless) | Yes (deleted from DB) |
| **If stolen** | 15 min exposure | Revoked on next rotation |

**Token rotation** ensures that each refresh token can only be used once. If an attacker steals a refresh token but the real user refreshes first, the stolen token becomes invalid.

### Products

All product endpoints (except GET by ID) require authentication. Include the access token:
```
Authorization: Bearer <accessToken>
```

#### Get All Products

```
GET /products
```

**Query Parameters:**

| Param      | Type   | Default | Description                          |
|------------|--------|---------|--------------------------------------|
| `offset`   | number | 0       | Pagination offset                    |
| `size`     | number | 10      | Items per page (max 100)             |
| `orderby`  | string | name    | Sort column: `name`, `price`, `category`, `brand`, `year`, `createdAt` |
| `order`    | string | asc     | Sort direction: `asc` or `desc`      |
| `category` | string | —       | Filter by category                   |
| `brand`    | string | —       | Filter by brand                      |
| `minPrice` | number | —       | Minimum price                        |
| `maxPrice` | number | —       | Maximum price                        |
| `year`     | number | —       | Filter by year                       |
| `search`   | string | —       | Case-insensitive name search (max 100 chars) |

**Response:**
```json
{
  "data": [ /* array of products */ ],
  "total": 1234
}
```

**Example:**
```
GET /api/products?category=Laptop&brand=Apple&minPrice=500&maxPrice=2000&offset=0&size=10&orderby=price&order=asc
```

The `orderby` parameter is validated against a whitelist of allowed columns. Invalid values default to `"name"`. The `order` parameter only accepts `"asc"` or `"desc"`, defaulting to `"asc"`.

### Get Product by ID

```
GET /products/:id
```

| Status | Description               |
|--------|---------------------------|
| 200    | Product found             |
| 400    | Invalid UUID format       |
| 404    | Product not found         |

### Create Product

```
POST /products
```

**Request Body:**
```json
{
  "name": "iPhone 16 Pro",
  "description": "Latest Apple flagship with A18 Pro chip",
  "category": "Smartphone",
  "brand": "Apple",
  "model": "iPhone 16 Pro",
  "year": 2024,
  "sku": "APL16PRO001",
  "price": 1199.99,
  "quantity": 50,
  "image": "https://picsum.photos/seed/iphone16/640/480"
}
```

| Status | Description               |
|--------|---------------------------|
| 201    | Product created           |
| 400    | Validation failed         |
| 409    | Product name already exists |

### Bulk Create Products

```
POST /products/bulk
```

**Request Body:** Array of product objects (minimum 1).

Duplicates are **skipped** — the rest of the batch is processed normally.

**Response:**
```json
{
  "created": [ /* products that were successfully created */ ],
  "skipped": [ "iPhone 16 Pro", "Galaxy S24" ]
}
```

| Status | Description               |
|--------|---------------------------|
| 201    | Batch processed           |
| 400    | Validation failed         |

## Validation

All endpoints validate request bodies using Zod schemas via a generic validation middleware. The schemas are the single source of truth for both runtime validation and TypeScript types.

**User registration fields:**

| Field      | Type   | Rules                             |
|------------|--------|-----------------------------------|
| `name`     | string | Required, min 1 character         |
| `email`    | string | Required, valid email format      |
| `password` | string | Required, min 8 characters        |
| `role`     | enum   | `"customer"` only (default: `"customer"`) |

**Refresh / Logout fields:**

| Field          | Type   | Rules                     |
|----------------|--------|---------------------------|
| `refreshToken` | string | Required, min 1 character |

**Product fields:**

| Field        | Type    | Rules                             |
|--------------|---------|-----------------------------------|
| `name`       | string  | Required, min 1 character         |
| `description`| string  | Required, min 1 character         |
| `category`   | string  | Required, min 3 characters        |
| `brand`      | string  | Required, min 1 character         |
| `model`      | string  | Required, min 1 character         |
| `year`       | number  | Integer, 2000 – current year      |
| `sku`        | string  | Required, min 3 characters        |
| `price`      | number  | Positive                          |
| `quantity`   | number  | Non-negative integer              |
| `image`      | string  | Required, min 1 character         |

**Validation error response (400):**
```json
{
  "message": "Validation failed",
  "errors": [
    {
      "code": "too_small",
      "path": ["name"],
      "message": "Name is required"
    }
  ]
}
```

## Type System

Two core types keep input and entity shapes separate:

- **`ProductData`** — Client input for create/update operations. Inferred from the Zod schema.
- **`IProduct`** — Full database entity. Extends `ProductData` with `id`, `createdAt`, `updatedAt`.

## Error Handling

A custom error class hierarchy (`errors/app-error.ts`) provides typed errors that the global error handler maps to HTTP status codes using `instanceof` — no brittle string matching.

| Error Class            | Status | Example Message                     |
|------------------------|--------|-------------------------------------|
| `ValidationError`      | 400    | Validation failed                   |
| `AuthenticationError`  | 401    | Invalid email or password           |
| `NotFoundError`        | 404    | User not found                      |
| `ConflictError`        | 409    | Email already registered            |
| Unknown / unexpected   | 500    | Internal server error               |

Additional HTTP-level errors:

| Scenario                 | Status | Response                          |
|--------------------------|--------|-----------------------------------|
| Invalid UUID             | 400    | `{ message: "Invalid product ID" }` |
| Missing/invalid JWT      | 401    | `{ message: "Authentication required" }` |
| Product not found        | 404    | `{ message: "Product not found" }` |

Server internals (stack traces, DB errors) are never exposed to clients.

## Security

| Concern                  | Mitigation                                                    |
|--------------------------|---------------------------------------------------------------|
| JWT secret               | `JWT_SECRET` env var is **required** — server throws on startup if missing |
| Password storage         | bcrypt hashed (10 salt rounds)                                |
| Password leakage         | Excluded from all API responses and `findById` queries        |
| Token rotation           | Refresh tokens are single-use — deleted after each refresh    |
| Role escalation          | Registration only allows `"customer"` role                    |
| Request size             | `express.json()` and `express.urlencoded()` limited to 10kb  |
| SQL injection via order  | `orderby` validated against a whitelist of allowed columns    |
| Search abuse             | Search string truncated to 100 characters                     |
| CORS                     | Enabled via `cors` middleware                                 |
| Stack trace leakage      | Global error handler returns generic message for unknown errors |

## Testing

```bash
npm test
```

### Test Strategy

| Type          | Tool              | What's real                        | What's mocked  |
|---------------|-------------------|------------------------------------|----------------|
| Unit          | Jest              | Validator schemas, service logic   | Repository     |
| Integration   | Jest + Supertest  | Routes, middleware, controller, service | Repository |

### Test Coverage

- **Validator tests** — Required fields, type checks, edge cases (empty strings, negative prices, decimal quantities, year boundaries)
- **Service tests** — Duplicate name handling (skip vs create), partial bulk create, batch all-unique and all-duplicate scenarios
- **Integration tests** — Full HTTP flow for GET/POST endpoints, paginated response shape (`{ data, total }`), filtering, validation errors, auth (401), 404/409 responses

## Scripts

| Script         | Command                              | Description                       |
|----------------|--------------------------------------|-----------------------------------|
| `npm run dev`  | `ts-node server.ts`                  | Start development server (auto-starts Docker via `predev`) |
| `npm run build`| `tsc`                                | Compile TypeScript to `dist/`     |
| `npm start`    | `node dist/server.js`                | Run production build              |
| `npm test`     | `jest`                               | Run all tests                     |

## Database

### Indexes

The product model includes indexes on frequently filtered columns for query performance:

| Column     | Index Type |
|------------|------------|
| `name`     | Unique     |
| `category` | B-tree     |
| `brand`    | B-tree     |
| `year`     | B-tree     |

### Description Storage

Product descriptions use `DataTypes.TEXT` (unlimited length) instead of `VARCHAR(255)` to accommodate detailed spec descriptions.

## Seed Data

The seed script generates 10,000 products across 9 categories with realistic data:

**Categories:** Smartphone, Laptop, Tablet, Smartwatch, Headphones, Camera, Monitor, Speaker, Gaming Console

Each category has appropriate brands, models, price ranges, and spec-accurate descriptions.

```bash
npx ts-node seed-data/product.seed.ts
```
