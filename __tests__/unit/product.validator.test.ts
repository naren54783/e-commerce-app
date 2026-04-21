import { createProductSchema, createBulkProductSchema } from "../../src/validators/product.validator";

// -------------------------------------------------------
// A valid product object we can reuse across tests.
// Each test modifies ONE field to test that specific rule.
// -------------------------------------------------------
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

describe("createProductSchema", () => {
  // -------------------------------------------------------
  // HAPPY PATH — valid data should pass
  // -------------------------------------------------------
  it("should pass with valid product data", () => {
    const result = createProductSchema.safeParse(validProduct);
    expect(result.success).toBe(true);
  });

  // -------------------------------------------------------
  // REQUIRED FIELDS — each required field missing should fail
  // -------------------------------------------------------
  it.each(["name", "description", "price", "category", "brand", "model", "year", "sku", "quantity", "image"])(
    "should fail when %s is missing",
    (field) => {
      const data = { ...validProduct };
      delete (data as any)[field];
      const result = createProductSchema.safeParse(data);
      expect(result.success).toBe(false);
    },
  );

  // -------------------------------------------------------
  // STRING FIELDS — empty strings should fail (min length)
  // -------------------------------------------------------
  it.each(["name", "description", "brand", "model", "image"])(
    "should fail when %s is an empty string",
    (field) => {
      const result = createProductSchema.safeParse({ ...validProduct, [field]: "" });
      expect(result.success).toBe(false);
    },
  );

  // -------------------------------------------------------
  // PRICE — must be positive
  // -------------------------------------------------------
  it("should fail when price is 0", () => {
    const result = createProductSchema.safeParse({ ...validProduct, price: 0 });
    expect(result.success).toBe(false);
  });

  it("should fail when price is negative", () => {
    const result = createProductSchema.safeParse({ ...validProduct, price: -10 });
    expect(result.success).toBe(false);
  });

  it("should fail when price is a string", () => {
    const result = createProductSchema.safeParse({ ...validProduct, price: "899" });
    expect(result.success).toBe(false);
  });

  // -------------------------------------------------------
  // QUANTITY — must be non-negative integer
  // -------------------------------------------------------
  it("should pass when quantity is 0", () => {
    const result = createProductSchema.safeParse({ ...validProduct, quantity: 0 });
    expect(result.success).toBe(true);
  });

  it("should fail when quantity is negative", () => {
    const result = createProductSchema.safeParse({ ...validProduct, quantity: -1 });
    expect(result.success).toBe(false);
  });

  it("should fail when quantity is a decimal", () => {
    const result = createProductSchema.safeParse({ ...validProduct, quantity: 5.5 });
    expect(result.success).toBe(false);
  });

  // -------------------------------------------------------
  // YEAR — must be between 2000 and current year
  // -------------------------------------------------------
  it("should fail when year is before 2000", () => {
    const result = createProductSchema.safeParse({ ...validProduct, year: 1999 });
    expect(result.success).toBe(false);
  });

  it("should fail when year is in the future", () => {
    const result = createProductSchema.safeParse({ ...validProduct, year: new Date().getFullYear() + 1 });
    expect(result.success).toBe(false);
  });

  // -------------------------------------------------------
  // CATEGORY — min 3 characters
  // -------------------------------------------------------
  it("should fail when category is less than 3 characters", () => {
    const result = createProductSchema.safeParse({ ...validProduct, category: "ab" });
    expect(result.success).toBe(false);
  });
});

describe("createBulkProductSchema", () => {
  it("should pass with an array of valid products", () => {
    const result = createBulkProductSchema.safeParse([validProduct, { ...validProduct, name: "iPhone 16" }]);
    expect(result.success).toBe(true);
  });

  it("should fail with an empty array", () => {
    const result = createBulkProductSchema.safeParse([]);
    expect(result.success).toBe(false);
  });

  it("should fail when one product in the array is invalid", () => {
    const result = createBulkProductSchema.safeParse([validProduct, { ...validProduct, price: -10 }]);
    expect(result.success).toBe(false);
  });

  it("should fail when input is not an array", () => {
    const result = createBulkProductSchema.safeParse(validProduct);
    expect(result.success).toBe(false);
  });
});
