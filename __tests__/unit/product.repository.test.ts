import {
  UniqueConstraintError,
  ValidationError as SequelizeValidationError,
} from "sequelize";
import { ConflictError } from "../../src/errors/app-error";

jest.mock("../../src/models/product.model", () => ({
  __esModule: true,
  default: {
    create: jest.fn(),
    bulkCreate: jest.fn(),
    findAll: jest.fn(),
  },
}));

import Product from "../../src/models/product.model";
import {
  create,
  createBulk,
  findByNames,
} from "../../src/repositories/product.repository";

const mockedCreate = Product.create as jest.MockedFunction<typeof Product.create>;
const mockedBulkCreate = Product.bulkCreate as jest.MockedFunction<typeof Product.bulkCreate>;
const mockedFindAll = Product.findAll as jest.MockedFunction<typeof Product.findAll>;

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

const makeUniqueConstraintError = () =>
  new UniqueConstraintError({
    message: "Validation error",
    errors: [],
  });

describe("product repository — unique constraint mapping", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("create", () => {
    it("returns the created product on success (happy path)", async () => {
      const saved = { id: "uuid-1", ...validProduct };
      mockedCreate.mockResolvedValue(saved as never);

      await expect(create(validProduct)).resolves.toBe(saved);
      expect(mockedCreate).toHaveBeenCalledWith(validProduct);
    });

    it("maps Sequelize UniqueConstraintError to ConflictError (status 409)", async () => {
      mockedCreate.mockRejectedValue(makeUniqueConstraintError());

      await expect(create(validProduct)).rejects.toBeInstanceOf(ConflictError);
      await expect(create(validProduct)).rejects.toMatchObject({
        statusCode: 409,
        message: "Product already exists",
      });
    });

    it("does NOT map other Sequelize errors (e.g. ValidationError) — they propagate untouched", async () => {
      const validationErr = new SequelizeValidationError("value too long", []);
      mockedCreate.mockRejectedValue(validationErr);

      await expect(create(validProduct)).rejects.toBe(validationErr);
      await expect(create(validProduct)).rejects.not.toBeInstanceOf(ConflictError);
    });

    it("rethrows unrelated errors untouched", async () => {
      const dbDown = new Error("connection refused");
      mockedCreate.mockRejectedValue(dbDown);

      await expect(create(validProduct)).rejects.toBe(dbDown);
    });
  });

  describe("createBulk", () => {
    it("returns the created products on success (happy path)", async () => {
      const saved = [{ id: "uuid-1", ...validProduct }];
      mockedBulkCreate.mockResolvedValue(saved as never);

      await expect(createBulk([validProduct])).resolves.toBe(saved);
      expect(mockedBulkCreate).toHaveBeenCalledWith([validProduct]);
    });

    it("forwards an empty input array without throwing", async () => {
      mockedBulkCreate.mockResolvedValue([] as never);

      await expect(createBulk([])).resolves.toEqual([]);
      expect(mockedBulkCreate).toHaveBeenCalledWith([]);
    });

    it("maps Sequelize UniqueConstraintError to ConflictError (status 409)", async () => {
      mockedBulkCreate.mockRejectedValue(makeUniqueConstraintError());

      await expect(createBulk([validProduct])).rejects.toBeInstanceOf(ConflictError);
      await expect(createBulk([validProduct])).rejects.toMatchObject({
        statusCode: 409,
        message: "One or more products already exist",
      });
    });

    it("does NOT map other Sequelize errors (e.g. ValidationError) — they propagate untouched", async () => {
      const validationErr = new SequelizeValidationError("value too long", []);
      mockedBulkCreate.mockRejectedValue(validationErr);

      await expect(createBulk([validProduct])).rejects.toBe(validationErr);
      await expect(createBulk([validProduct])).rejects.not.toBeInstanceOf(ConflictError);
    });

    it("rethrows unrelated errors untouched", async () => {
      const dbDown = new Error("connection refused");
      mockedBulkCreate.mockRejectedValue(dbDown);

      await expect(createBulk([validProduct])).rejects.toBe(dbDown);
    });
  });

  describe("findByNames", () => {
    it("queries Product.findAll with a WHERE name IN (...) clause and returns the rows", async () => {
      const rows = [{ id: "uuid-1", name: "A" }, { id: "uuid-2", name: "B" }];
      mockedFindAll.mockResolvedValue(rows as never);

      await expect(findByNames(["A", "B"])).resolves.toBe(rows);
      expect(mockedFindAll).toHaveBeenCalledTimes(1);

      const arg = mockedFindAll.mock.calls[0]![0] as { where: { name: Record<symbol, unknown> } };
      const nameFilter = arg.where.name;
      const inOperatorSymbol = Object.getOwnPropertySymbols(nameFilter).find(
        (s) => s.description === "in",
      );
      expect(inOperatorSymbol).toBeDefined();
      expect(nameFilter[inOperatorSymbol!]).toEqual(["A", "B"]);
    });

    it("returns an empty array when no names match", async () => {
      mockedFindAll.mockResolvedValue([] as never);

      await expect(findByNames(["nope"])).resolves.toEqual([]);
    });
  });
});
