/**
 * Global error handler middleware.
 * Returns generic error to client, logs details server-side.
 */
export function errorHandler(err, req, res, _next) {
  // Log without PII
  console.error(`[ERROR] ${err.name || 'Error'}: ${err.message}`);
  if (process.env.NODE_ENV === 'development') {
    console.error(err.stack);
  }

  const statusCode = err.statusCode || 500;
  const message = statusCode < 500
    ? err.message
    : 'An internal error occurred. Please try again.';

  res.status(statusCode).json({ error: message });
}
