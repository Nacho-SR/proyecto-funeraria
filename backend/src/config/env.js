const dotenv = require("dotenv");
const { z } = require("zod");

dotenv.config();

const EnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(3000),
  JWT_SECRET: z.string().min(10, "JWT_SECRET must be at least 10 characters"),
  JWT_EXPIRES_IN: z.string().default("24h"),
  MASTER_ADMIN_KEY: z.string().min(8, "MASTER_ADMIN_KEY must be at least 8 characters"),
  CORS_ORIGIN: z.string().optional(),
  FIREBASE_SERVICE_ACCOUNT_JSON: z.string().optional(),
});

const parsedEnv = EnvSchema.safeParse(process.env);

if (!parsedEnv.success) {
  const formattedErrors = parsedEnv.error.issues
    .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
    .join("; ");
  throw new Error(`Invalid environment configuration: ${formattedErrors}`);
}

const env = parsedEnv.data;

module.exports = {
  env,
};
