import 'dotenv/config';
import { env } from '../../src/utils/env.js';

describe('env validation', () => {
  it('should load env without error', () => {
    expect(env.NODE_ENV).toBeDefined();
  });
});
