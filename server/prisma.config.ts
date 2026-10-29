// A config file opts the Prisma CLI out of loading the env file implicitly, so it is loaded
// here or DATABASE_URL is undefined for `migrate deploy`.
import { defineConfig } from 'prisma/config'

import 'dotenv/config'

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    seed: 'tsx prisma/seed.ts',
  },
})
