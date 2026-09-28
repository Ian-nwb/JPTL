/**
 * asyncHandler
 * Wraps an async Express route handler and forwards any thrown errors to next().
 * Eliminates repetitive try/catch blocks in controllers.
 *
 * Usage:
 *   router.get('/route', asyncHandler(async (req, res) => { ... }));
 *
 * Errors with a .statusCode property are forwarded as-is (service layer errors).
 * All other errors fall through to the global error handler in server.js.
 */
export function asyncHandler(fn) {
  return function asyncHandlerWrapper(req, res, next) {
    return Promise.resolve(fn(req, res, next)).catch(next);
  };
}

export default asyncHandler;
