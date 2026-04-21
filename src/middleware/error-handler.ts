import { Request, Response, NextFunction } from "express";
import { AppError } from "../errors/app-error";
import logger from "../config/logger";

export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
) => {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({ message: err.message });
    return;
  }

  logger.error(err.message, { stack: err.stack });
  res.status(500).json({ message: "Internal server error" });
};
