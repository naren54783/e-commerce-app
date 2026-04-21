import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../config/auth";
import logger from "../config/logger";

export interface AuthPayload {
  id: string;
  email: string;
  role: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthPayload;
    }
  }
}

export const authenticate = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    res.status(401).json({ message: "Authentication required" });
    return;
  }

  const token = header.split(" ")[1];

  try {
    if(!token) throw new Error('Invalid request, User not authenticated.');
    const decoded = jwt.verify(token, JWT_SECRET) as unknown as AuthPayload;
    req.user = decoded;
    next();
  } catch (error) {
    logger.warn("Token verification failed", { error: error instanceof Error ? error.message : String(error) });
    res.status(401).json({ message: "Invalid or expired token" });
  }
};
