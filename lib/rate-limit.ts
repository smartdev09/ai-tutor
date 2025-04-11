import { rateLimitConfig } from './validations/schemas';

export class RateLimitError extends Error {
  constructor(message: string, public resetTime: Date) {
    super(message);
    this.name = 'RateLimitError';
  }
}

// Simple in-memory rate limiting
const rateLimits = new Map<string, { count: number; lastReset: Date }>();

export async function checkRateLimit(ip: string, endpoint: keyof typeof rateLimitConfig) {
  const config = rateLimitConfig[endpoint];
  const now = new Date();
  const key = `${ip}:${endpoint}`;

  const limit = rateLimits.get(key);
  
  // If no record exists or reset time has passed, create/update record
  if (!limit || now.getTime() - limit.lastReset.getTime() > config.duration * 1000) {
    rateLimits.set(key, {
      count: 1,
      lastReset: now
    });
    return true;
  }

  // Check if limit exceeded
  if (limit.count >= config.points) {
    const resetTime = new Date(limit.lastReset);
    resetTime.setSeconds(resetTime.getSeconds() + config.duration);
    throw new RateLimitError(
      `Rate limit exceeded for ${endpoint}. Try again after ${resetTime.toLocaleString()}`,
      resetTime
    );
  }

  // Increment counter
  limit.count += 1;
  rateLimits.set(key, limit);

  return true;
} 