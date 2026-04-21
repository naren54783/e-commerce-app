import {
  create,
  findAll,
  findById,
  findByNames,
  createBulk,
} from "../repositories/product.repository";
import { ProductData } from "../models/product.model";
import { ConflictError } from "../errors/app-error";

export interface ProductFilters {
  category?: string;
  brand?: string;
  minPrice?: number;
  maxPrice?: number;
  year?: number;
  search?: string;
}

export const getAllProducts = async (
  offset: number,
  size: number,
  orderBy: string,
  order: string,
  filters: ProductFilters,
) => {
  return findAll(offset, size, orderBy, order, filters);
};

export const getProductById = async (id: string) => {
  return findById(id);
};

export const createProduct = async (data: ProductData) => {
  const existing = await findByNames([data.name]);
  if (existing.length > 0) {
    throw new ConflictError("Product already exists");
  }
  return create(data);
};

export const createProducts = async (dataList: ProductData[]) => {
  const names = dataList.map((p) => p.name);
  const existing = await findByNames(names);
  const duplicateNames = new Set(
    existing.map((p) => (p.toJSON() as Record<string, unknown>).name as string),
  );

  const newProducts = dataList.filter((p) => !duplicateNames.has(p.name));
  const skipped = dataList.filter((p) => duplicateNames.has(p.name)).map((p) => p.name);

  const created = newProducts.length > 0 ? await createBulk(newProducts) : [];

  return { created, skipped };
};
