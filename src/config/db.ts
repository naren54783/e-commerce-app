import { Sequelize } from "sequelize";
import logger from "./logger";

const db_string: string = `postgres://${process.env.POSTGRES_USER}:${process.env.POSTGRES_PASSWORD}@${process.env.POSTGRES_HOST}:${process.env.POSTGRES_PORT}/${process.env.POSTGRES_DB}`;
const sequelize = new Sequelize(db_string);

export async function connectDB() {
  try {
    await sequelize.authenticate();
    logger.info("Database connected");
    await sequelize.sync();
    logger.info("Models synchronized");
  } catch (error) {
    logger.error("Database connection failed", { error });
    process.exit(1);
  }
}

export default sequelize;
