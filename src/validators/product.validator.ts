import { z } from "zod";

export const createProductSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().min(1, "Description is required"),
  price: z.number().positive("Price must be a positive number"),
  category: z.string().min(3, "Category is required"),
  brand: z.string().min(1, "Brand is required"),
  model: z.string().min(1, "Model is required"),
  year: z.number().int().min(2000).max(new Date().getFullYear()),
  sku: z.string().min(3, "SKU is required"),
  quantity: z
    .number()
    .int()
    .nonnegative("Quantity must be a non-negative integer"),
  image: z.string().min(1, "Image is required"),
});

export const createBulkProductSchema = createProductSchema
  .array()
  .min(1, "At least one product is required");

export type ProductData = z.infer<typeof createProductSchema>;
