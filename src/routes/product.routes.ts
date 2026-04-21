import { Router } from "express";
import { validate } from "../middleware/validate";
import { authenticate } from "../middleware/auth";
import {
  createProductSchema,
  createBulkProductSchema,
} from "../validators/product.validator";
import {
  getProducts,
  getProduct,
  createProduct,
  createBulkProducts,
} from "../controllers/product.controller";

const router: Router = Router();

// Public — no auth needed
router.get("/products", authenticate, getProducts);
router.get("/products/:id", getProduct);

// Protected — requires JWT
router.post(
  "/products",
  authenticate,
  validate(createProductSchema),
  createProduct,
);
router.post(
  "/products/bulk",
  authenticate,
  validate(createBulkProductSchema),
  createBulkProducts,
);

export default router;
