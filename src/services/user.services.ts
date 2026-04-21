import crypto from "crypto";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { findById, findByEmail, create } from "../repositories/user.repository";
import {
  createToken,
  findByToken,
  deleteByToken,
} from "../repositories/refresh-token.repository";
import { RegisterData, LoginData } from "../validators/user.validator";
import { JWT_SECRET, ACCESS_TOKEN_EXPIRES, REFRESH_TOKEN_DAYS } from "../config/auth";
import { ConflictError, AuthenticationError, NotFoundError } from "../errors/app-error";

const generateAccessToken = (payload: Record<string, unknown>) => {
  return jwt.sign(
    { id: payload.id, email: payload.email, role: payload.role },
    JWT_SECRET,
    { expiresIn: ACCESS_TOKEN_EXPIRES },
  );
};

const generateRefreshToken = async (userId: string) => {
  const token = crypto.randomBytes(40).toString("hex");
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_DAYS);
  await createToken(token, userId, expiresAt);
  return token;
};

export const registerUser = async (data: RegisterData) => {
  const existing = await findByEmail(data.email);
  if (existing) {
    throw new ConflictError("Email already registered");
  }

  const hashedPassword = await bcrypt.hash(data.password, 10);
  const user = await create({ ...data, password: hashedPassword });

  const { password, ...userWithoutPassword } = user.toJSON() as Record<string, unknown>;
  return userWithoutPassword;
};

export const loginUser = async (data: LoginData) => {
  const user = await findByEmail(data.email);
  if (!user) {
    throw new AuthenticationError("Invalid email or password");
  }

  const userData = user.toJSON() as Record<string, unknown>;
  const isMatch = await bcrypt.compare(data.password, userData.password as string);
  if (!isMatch) {
    throw new AuthenticationError("Invalid email or password");
  }

  const accessToken = generateAccessToken(userData);
  const refreshToken = await generateRefreshToken(userData.id as string);

  const { password, ...userWithoutPassword } = userData;
  return { user: userWithoutPassword, accessToken, refreshToken };
};

export const refreshAccessToken = async (token: string) => {
  const stored = await findByToken(token);
  if (!stored) {
    throw new AuthenticationError("Invalid refresh token");
  }

  const tokenData = stored.toJSON() as Record<string, unknown>;
  const expiresAt = new Date(tokenData.expiresAt as string);

  if (expiresAt < new Date()) {
    await deleteByToken(token);
    throw new AuthenticationError("Refresh token expired");
  }

  // Rotate: delete old token, issue new pair
  await deleteByToken(token);

  const user = await findById(tokenData.userId as string);
  if (!user) {
    throw new NotFoundError("User not found");
  }

  const userData = user.toJSON() as Record<string, unknown>;
  const accessToken = generateAccessToken(userData);
  const refreshToken = await generateRefreshToken(userData.id as string);

  return { accessToken, refreshToken };
};

export const logoutUser = async (token: string) => {
  await deleteByToken(token);
};
