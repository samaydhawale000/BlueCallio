/**
 * Shared CORS origin allowlist for both the HTTP server (main.ts) and the
 * WebSocket gateway (call.gateway.ts) — one source of truth so they can't
 * drift (e.g. HTTP locked down while the socket stays wide open).
 *
 * Configured via ALLOWED_ORIGINS (comma-separated). If unset: falls back to
 * localhost defaults for local dev, but refuses to wildcard-open in
 * production — a misconfigured deploy should reject cross-origin requests,
 * not silently allow every origin.
 */
const DEV_DEFAULT_ORIGINS = ['http://localhost:3000', 'http://localhost:5173'];

export function getAllowedOrigins(): string[] {
  const configured = process.env.ALLOWED_ORIGINS;
  if (configured && configured.trim()) {
    return configured
      .split(',')
      .map((o) => o.trim())
      .filter(Boolean);
  }
  return process.env.NODE_ENV === 'production' ? [] : DEV_DEFAULT_ORIGINS;
}

/**
 * CORS `origin` callback (works for both Express CORS and Socket.IO CORS).
 * Reads the allowlist fresh on every call rather than once at import time,
 * so it's correct regardless of whether ALLOWED_ORIGINS has been loaded yet
 * when this module's decorators first evaluate.
 */
export function corsOriginCallback(
  origin: string | undefined,
  callback: (err: Error | null, allow?: boolean) => void,
): void {
  // No Origin header (server-to-server calls, curl, mobile clients) — allow.
  if (!origin) return callback(null, true);

  const allowed = getAllowedOrigins();
  if (allowed.includes(origin)) return callback(null, true);
  callback(new Error(`Origin ${origin} is not allowed by CORS.`));
}
