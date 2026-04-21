if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET environment variable is required");
}

export const JWT_SECRET: string = process.env.JWT_SECRET;
export const ACCESS_TOKEN_EXPIRES: number = parseInt(process.env.JWT_EXPIRES_IN || "900", 10);
export const REFRESH_TOKEN_DAYS: number = 7;
