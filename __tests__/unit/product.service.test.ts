import { createProduct, createProducts } from "../../src/services/product.services";

// -------------------------------------------------------
// Mock the REPOSITORY layer (one layer below service).
// We test the service's business logic, not Sequelize.
// -------------------------------------------------------
jest.mock("../../src/repositories/product.repository", () => ({
  findByNames: jest.fn(),
  create: jest.fn(),
  createBulk: jest.fn(),
  findAll: jest.fn(),
  findById: jest.fn(),
}));

import { findByNames, create, createBulk } from "../../src/repositories/product.repository";
const mockedFindByNames = findByNames as jest.MockedFunction<typeof findByNames>;
const mockedCreate = create as jest.MockedFunction<typeof create>;
const mockedCreateBulk = createBulk as jest.MockedFunction<typeof createBulk>;

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

describe("createProduct service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // -------------------------------------------------------
  // BUSINESS RULE: Cannot create a product with a duplicate name
  // This is the real logic worth testing in the service.
  // -------------------------------------------------------
  it("should throw when product name already exists", async () => {
    // Arrange — findByNames returns an existing product
    mockedFindByNames.mockResolvedValue([{ id: "existing-id", ...validProduct }] as any);

    // Act & Assert — service should reject
    await expect(createProduct(validProduct)).rejects.toThrow("Product already exists");

    // create() should never be called
    expect(mockedCreate).not.toHaveBeenCalled();
  });

  // -------------------------------------------------------
  // HAPPY PATH: Name doesn't exist → create the product
  // -------------------------------------------------------
  it("should create product when name is unique", async () => {
    mockedFindByNames.mockResolvedValue([] as any);
    mockedCreate.mockResolvedValue({ id: "new-id", ...validProduct } as any);

    const result = await createProduct(validProduct);

    expect(mockedFindByNames).toHaveBeenCalledWith(["Samsung Galaxy S24"]);
    expect(mockedCreate).toHaveBeenCalledWith(validProduct);
    expect(result).toHaveProperty("id", "new-id");
  });
});

describe("createProducts (bulk) service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // -------------------------------------------------------
  // PARTIAL CREATE: Duplicates are skipped, rest are created
  // -------------------------------------------------------
  it("should skip duplicates and create the rest", async () => {
    const products = [
      validProduct,
      { ...validProduct, name: "iPhone 16" },
    ];

    // findByNames returns one match — iPhone 16 already exists
    mockedFindByNames.mockResolvedValue([
      { toJSON: () => ({ name: "iPhone 16" }) },
    ] as any);
    mockedCreateBulk.mockResolvedValue([validProduct] as any);

    const result = await createProducts(products);

    // Only the non-duplicate product should be created
    expect(mockedCreateBulk).toHaveBeenCalledWith([validProduct]);
    expect(result.created).toHaveLength(1);
    expect(result.skipped).toEqual(["iPhone 16"]);
  });

  // -------------------------------------------------------
  // ALL DUPLICATES: Nothing created, all skipped
  // -------------------------------------------------------
  it("should skip all when every product already exists", async () => {
    const products = [validProduct];

    mockedFindByNames.mockResolvedValue([
      { toJSON: () => ({ name: "Samsung Galaxy S24" }) },
    ] as any);

    const result = await createProducts(products);

    expect(mockedCreateBulk).not.toHaveBeenCalled();
    expect(result.created).toEqual([]);
    expect(result.skipped).toEqual(["Samsung Galaxy S24"]);
  });

  // -------------------------------------------------------
  // HAPPY PATH: All names are unique → bulk create all
  // -------------------------------------------------------
  it("should bulk create when all names are unique", async () => {
    const products = [
      validProduct,
      { ...validProduct, name: "iPhone 16" },
    ];

    mockedFindByNames.mockResolvedValue([] as any);
    mockedCreateBulk.mockResolvedValue(products as any);

    const result = await createProducts(products);

    // Should check all names in one query
    expect(mockedFindByNames).toHaveBeenCalledTimes(1);
    expect(mockedFindByNames).toHaveBeenCalledWith(["Samsung Galaxy S24", "iPhone 16"]);
    expect(mockedCreateBulk).toHaveBeenCalledWith(products);
    expect(result.created).toHaveLength(2);
    expect(result.skipped).toEqual([]);
  });
});
