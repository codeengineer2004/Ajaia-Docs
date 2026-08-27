import { createHmac, timingSafeEqual } from 'crypto';
import { NextRequest } from 'next/server';

const COOKIE_NAME = 'ajaia-session';
const AUTH_SECRET = process.env.AJAIA_AUTH_SECRET || 'ajaia-local-development-secret';

function signature(userId: string) {
  return createHmac('sha256', AUTH_SECRET).update(userId).digest('hex');
}

export function createSessionToken(userId: string) {
  return `${userId}.${signature(userId)}`;
}

export function getAuthenticatedUserId(req: NextRequest): string | null {
  const token = req.cookies.get(COOKIE_NAME)?.value;
  if (!token) return null;
  const separator = token.lastIndexOf('.');
  if (separator < 1) return null;
  const userId = token.slice(0, separator);
  const providedSignature = token.slice(separator + 1);
  const expectedSignature = signature(userId);
  if (providedSignature.length !== expectedSignature.length) return null;
  if (!timingSafeEqual(Buffer.from(providedSignature), Buffer.from(expectedSignature))) return null;
  return userId;
}

export { COOKIE_NAME };
