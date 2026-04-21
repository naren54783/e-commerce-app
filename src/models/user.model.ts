import { DataTypes } from "sequelize";
import sequelize from "../config/db";
import { RegisterData } from "../validators/user.validator";

export type UserData = RegisterData;

export interface IUser extends UserData {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

const User = sequelize.define(
  "User",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    role: {
      type: DataTypes.ENUM("customer", "admin"),
      allowNull: false,
      defaultValue: "customer",
    },
  },
  {
    tableName: "users",
    timestamps: true,
  },
);

export default User;
