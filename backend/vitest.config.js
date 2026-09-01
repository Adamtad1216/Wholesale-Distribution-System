import { defineConfig } from 'vitest/config';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const envResult = config({ path: join(__dirname, '.env'), override: true });

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    env: envResult.parsed || {},
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
    },
    fileParallelism: false,
  },
});
