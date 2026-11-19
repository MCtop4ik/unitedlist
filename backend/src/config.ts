import { z } from 'zod';

const schema = z.object({
  DATABASE_PATH: z.string().default('./data/gdul.sqlite'),
  PORT: z.coerce.number().int().positive().default(3001),
  FRONTEND_ORIGIN: z.string().default('http://localhost:5173'),
  LOG_LEVEL: z.string().default('info'),
  CATALOG_TTL_MS: z.coerce.number().int().positive().default(600000),
});

export type Config = z.infer<typeof schema>;
export function loadConfig(env: NodeJS.ProcessEnv = process.env): Config {
  return schema.parse(env);
}
