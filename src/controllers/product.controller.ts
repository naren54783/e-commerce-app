import {
  createProduct as createProd,
  getAllProducts,
  getProductById,
  createProducts,
} from "../services/product.services";
import { Request, Response, NextFunction } from "express";
import { z } from "zod";

const uuidParam = z.uuidv4({ error: "Invalid product ID" });

const VALID_ORDER_COLUMNS = ["name", "price", "category", "brand", "year", "createdAt"];
const VALID_ORDER_DIRECTIONS = ["asc", "desc"];

export const getProducts = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const offset = Math.max(0, Number(req.query.offset) || 0);
    const size = Math.min(100, Math.max(1, Number(req.query.size) || 10));
    const orderBy = VALID_ORDER_COLUMNS.includes(req.query.orderby as string)
      ? (req.query.orderby as string)
      : "name";
    const order = VALID_ORDER_DIRECTIONS.includes((req.query.order as string)?.toLowerCase())
      ? (req.query.order as string).toLowerCase()
      : "asc";

    const search = req.query.search as string | undefined;

    const filters = {
      category: req.query.category as string | undefined,
      brand: req.query.brand as string | undefined,
      minPrice: req.query.minPrice ? Number(req.query.minPrice) : undefined,
      maxPrice: req.query.maxPrice ? Number(req.query.maxPrice) : undefined,
      year: req.query.year ? Number(req.query.year) : undefined,
      search: search?.slice(0, 100),
    };

    const products = await getAllProducts(offset, size, orderBy, order, filters);
    res.status(200).json(products);
  } catch (error) {
    next(error);
  }
};

export const getProduct = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const parsed = uuidParam.safeParse(req.params.id);
    if (!parsed.success) {
      res.status(400).json({ message: "Invalid product ID" });
      return;
    }
    const product = await getProductById(parsed.data);
    if (!product) {
      res.status(404).json({ message: "Product not found" });
      return;
    }
    res.status(200).json(product);
  } catch (error) {
    next(error);
  }
};

export const createProduct = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const product = await createProd(req.body);
    res.status(201).json(product);
  } catch (error) {
    next(error);
  }
};

export const createBulkProducts = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const product = await createProducts(req.body);
    res.status(201).json(product);
  } catch (error) {
    next(error);
  }
};


