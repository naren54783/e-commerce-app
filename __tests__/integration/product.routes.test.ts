import request from "supertest";
import jwt from "jsonwebtoken";
import app from "../../src/app";

// -------------------------------------------------------
// Mock the REPOSITORY — the database boundary.
// Everything above it (routes, middleware, controller,
// service) runs for real. That's the point of integration
// tests: testing real layers working together.
// -------------------------------------------------------
jest.mock("../../src/repositories/product.repository", () => ({
  findAll: jest.fn(),
  findById: jest.fn(),
  findByNames: jest.fn(),
  create: jest.fn(),
  createBulk: jest.fn(),
}));

import { findAll, findById, findByNames, create } from "../../src/repositories/product.repository";
const mockedFindAll = findAll as jest.MockedFunction<typeof findAll>;
const mockedFindById = findById as jest.MockedFunction<typeof findById>;
const mockedFindByNames = findByNames as jest.MockedFunction<typeof findByNames>;
const mockedCreate = create as jest.MockedFunction<typeof create>;

// -------------------------------------------------------
// Generate a valid JWT for protected route tests.
// This uses the same secret as the auth middleware.
// -------------------------------------------------------
const JWT_SECRET = process.env.JWT_SECRET || "default_secret_change_me";
const testToken = jwt.sign(
  { id: "test-user-id", email: "test@example.com", role: "admin" },
  JWT_SECRET,
  { expiresIn: 3600 },
);

const validProduct = {
  name: "Samsung Galaxy S24",
  description: "Latest Samsung flagship",
  price: 899.99,
  category: "Smartphone",
  brand: "Samsung",
  model: "Galaxy S24",
  year: 2024,
  sku: "ABC1234567",
  quantity: 50,
  image: "https://picsum.photos/seed/1/640/480",
};

// -------------------------------------------------------
// GET /api/products — List products
// -------------------------------------------------------
describe("GET /api/products", () => {
  beforeEach(() => jest.clearAllMocks());

  it("should return 200 with data and total", async () => {
    const fakeProducts = [
      { id: "uuid-1", ...validProduct },
      { id: "uuid-2", ...validProduct, name: "iPhone 16" },
    ];
    mockedFindAll.mockResolvedValue({ data: fakeProducts, total: 2 } as any);

    const res = await request(app)
      .get("/api/products")
      .set("Authorization", `Bearer ${testToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(2);
    expect(res.body.total).toBe(2);
    expect(res.body.data[0].name).toBe("Samsung Galaxy S24");
  });

  it("should pass pagination params to repository", async () => {
    mockedFindAll.mockResolvedValue({ data: [], total: 0 } as any);

    await request(app)
      .get("/api/products?offset=10&size=5&orderby=price&order=desc")
      .set("Authorization", `Bearer ${testToken}`);

    expect(mockedFindAll).toHaveBeenCalledWith(
      10, 5, "price", "desc",
      expect.any(Object),
    );
  });

  it("should pass filter params to repository", async () => {
    mockedFindAll.mockResolvedValue({ data: [], total: 0 } as any);

    await request(app)
      .get("/api/products?category=Laptop&brand=Apple&minPrice=500&maxPrice=2000")
      .set("Authorization", `Bearer ${testToken}`);

    expect(mockedFindAll).toHaveBeenCalledWith(
      0, 10, "name", "asc",
      expect.objectContaining({
        category: "Laptop",
        brand: "Apple",
        minPrice: 500,
        maxPrice: 2000,
      }),
    );
  });

  it("should return 200 with empty data when no products found", async () => {
    mockedFindAll.mockResolvedValue({ data: [], total: 0 } as any);

    const res = await request(app)
      .get("/api/products")
      .set("Authorization", `Bearer ${testToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([]);
    expect(res.body.total).toBe(0);
  });
});

// -------------------------------------------------------
// GET /api/products/:id — Get single product
// -------------------------------------------------------
describe("GET /api/products/:id", () => {
  beforeEach(() => jest.clearAllMocks());

  it("should return 200 with the product", async () => {
    const fakeProduct = { id: "550e8400-e29b-41d4-a716-446655440000", ...validProduct };
    mockedFindById.mockResolvedValue(fakeProduct as any);

    const res = await request(app).get("/api/products/550e8400-e29b-41d4-a716-446655440000");

    expect(res.status).toBe(200);
    expect(res.body.name).toBe("Samsung Galaxy S24");
  });

  it("should return 404 when product not found", async () => {
    mockedFindById.mockResolvedValue(null as any);

    const res = await request(app).get("/api/products/550e8400-e29b-41d4-a716-446655440000");

    expect(res.status).toBe(404);
    expect(res.body.message).toBe("Product not found");
  });

  it("should return 400 for invalid UUID", async () => {
    const res = await request(app).get("/api/products/not-a-uuid");

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Invalid product ID");
    // Repository should never be called with bad ID
    expect(mockedFindById).not.toHaveBeenCalled();
  });
});

// -------------------------------------------------------
// POST /api/products — Create product
// Tests validation middleware + controller + service together
// -------------------------------------------------------
describe("POST /api/products", () => {
  beforeEach(() => jest.clearAllMocks());

  it("should return 401 when no token is provided", async () => {
    const res = await request(app)
      .post("/api/products")
      .send(validProduct);

    expect(res.status).toBe(401);
    expect(res.body.message).toBe("Authentication required");
  });

  it("should return 201 when creating a valid product", async () => {
    mockedFindByNames.mockResolvedValue([] as any);
    mockedCreate.mockResolvedValue({ id: "new-uuid", ...validProduct } as any);

    const res = await request(app)
      .post("/api/products")
      .set("Authorization", `Bearer ${testToken}`)
      .send(validProduct);

    expect(res.status).toBe(201);
    expect(res.body.id).toBe("new-uuid");
  });

  // -------------------------------------------------------
  // VALIDATION — Zod middleware rejects before hitting controller
  // -------------------------------------------------------
  it("should return 400 when required fields are missing", async () => {
    const res = await request(app)
      .post("/api/products")
      .set("Authorization", `Bearer ${testToken}`)
      .send({ name: "Incomplete Product" });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Validation failed");
    // Service/repo should never be called
    expect(mockedFindByNames).not.toHaveBeenCalled();
  });

  it("should return 400 when price is negative", async () => {
    const res = await request(app)
      .post("/api/products")
      .set("Authorization", `Bearer ${testToken}`)
      .send({ ...validProduct, price: -10 });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Validation failed");
  });

  it("should return 400 when quantity is a decimal", async () => {
    const res = await request(app)
      .post("/api/products")
      .set("Authorization", `Bearer ${testToken}`)
      .send({ ...validProduct, quantity: 5.5 });

    expect(res.status).toBe(400);
  });

  // -------------------------------------------------------
  // DUPLICATE — passes validation, but service rejects
  // -------------------------------------------------------
  it("should return 409 when product name already exists", async () => {
    mockedFindByNames.mockResolvedValue([{ id: "existing" }] as any);

    const res = await request(app)
      .post("/api/products")
      .set("Authorization", `Bearer ${testToken}`)
      .send(validProduct);

    expect(res.status).toBe(409);
    expect(res.body.message).toBe("Product already exists");
  });
});
