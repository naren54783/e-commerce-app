import { registerUser, loginUser, refreshAccessToken, logoutUser } from "../services/user.services";
import { Request, Response, NextFunction } from "express";

export const register = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const user = await registerUser(req.body);
    res.status(201).json(user);
  } catch (error) {
    next(error);
  }
};

export const login = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const result = await loginUser(req.body);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const refresh = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const tokens = await refreshAccessToken(req.body.refreshToken);
    res.status(200).json(tokens);
  } catch (error) {
    next(error);
  }
};

export const logout = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    await logoutUser(req.body.refreshToken);
    res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    next(error);
  }
};
