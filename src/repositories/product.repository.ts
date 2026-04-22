import { Op, UniqueConstraintError } from "sequelize";
import Product, { ProductData } from "../models/product.model";
import { ProductFilters } from "../services/product.services";
import { ConflictError } from "../errors/app-error";

export const findAll = async (
  offset: number,
  size: number,
  orderby: string,
  order: string,
  filters: ProductFilters,
) => {
  const where: Record<string, unknown> = {};

  if (filters.category) {
    where.category = filters.category;
  }
  if (filters.brand) {
    where.brand = filters.brand;
  }
  if (filters.year) {
    where.year = filters.year;
  }
  if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
    where.price = {
      ...(filters.minPrice !== undefined ? { [Op.gte]: filters.minPrice } : {}),
      ...(filters.maxPrice !== undefined ? { [Op.lte]: filters.maxPrice } : {}),
    };
  }
  if (filters.search) {
    where.name = { [Op.iLike]: `%${filters.search}%` };
  }

  const { rows, count } = await Product.findAndCountAll({
    where,
    offset,
    limit: size,
    order: [[orderby, order]],
  });

  return { data: rows, total: count };
};

export const findById = async (id: string) => {
  return Product.findByPk(id);
};

export const findByNames = async (names: string[]) => {
  return Product.findAll({ where: { name: { [Op.in]: names } } });
};

export const create = async (data: ProductData) => {
  try {
    return await Product.create(data as Record<string, unknown>);
  } catch (err) {
    if (err instanceof UniqueConstraintError) {
      throw new ConflictError("Product already exists");
    }
    throw err;
  }
};

export const createBulk = async (dataList: ProductData[]) => {
  try {
    return await Product.bulkCreate(dataList as Record<string, unknown>[]);
  } catch (err) {
    if (err instanceof UniqueConstraintError) {
      throw new ConflictError("One or more products already exist");
    }
    throw err;
  }
};
