import * as jwt from 'jsonwebtoken';

const TEST_JWT_SECRET = 'test-secret';

/**
 * Generate a valid JWT token for e2e tests.
 * Uses jsonwebtoken directly to create properly formatted tokens
 * that passport-jwt can decode.
 */
export function generateTestToken(payload: {
  sub: string;
  email: string;
  [key: string]: any;
}): string {
  return jwt.sign(payload, TEST_JWT_SECRET, { expiresIn: '1h' });
}

export const TEST_JWT_SECRET_CONST = TEST_JWT_SECRET;
