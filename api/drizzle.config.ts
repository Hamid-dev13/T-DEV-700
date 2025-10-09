/// <reference types="node" />
import type { Config } from "drizzle-kit";
import dotenv from "dotenv";

dotenv.config({ path: "../.env" });

export default {
  schema: [
    "./models/user.model.ts",
    "./models/team.model.ts",
    "./models/user_team.model.ts",
    "./models/log.model.ts",
  ],
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!
  },
} satisfies Config;
