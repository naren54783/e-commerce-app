import RefreshToken from "../models/refresh-token.model";

export const createToken = async (token: string, userId: string, expiresAt: Date) => {
  return RefreshToken.create({ token, userId, expiresAt } as Record<string, unknown>);
};

export const findByToken = async (token: string) => {
  return RefreshToken.findOne({ where: { token } });
};

export const deleteByToken = async (token: string) => {
  return RefreshToken.destroy({ where: { token } });
};

export const deleteAllByUserId = async (userId: string) => {
  return RefreshToken.destroy({ where: { userId } });
};
