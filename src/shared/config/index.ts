import dotenv from "dotenv";

dotenv.config();

export const config = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: parseInt(process.env.PORT || "3000", 10),

  jwt: {
    secret: process.env.JWT_SECRET || "your-super-secret-jwt-key-change-this",
    refreshSecret:
      process.env.JWT_REFRESH_SECRET ||
      "your-super-secret-refresh-key-change-this",
    expiresIn: process.env.JWT_EXPIRES_IN || "15m",
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d",
  },

  database: {
    url: process.env.DATABASE_URL,
  },
};
