import User, { UserData } from "../models/user.model";

export const findById = async (id: string) => {
  return User.findByPk(id, { attributes: { exclude: ["password"] } });
};

export const findByEmail = async (email: string) => {
  return User.findOne({ where: { email } });
};

export const create = async (data: UserData) => {
  return User.create(data as Record<string, unknown>);
};
