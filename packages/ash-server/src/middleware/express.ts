/**
 * ASH Express Middleware
 *
 * Drop-in middleware for Express.js applications.
 *
 * @module @anthropic/ash-server
 */

import { AshError } from '@anthropic/ash-core';
import type { SupportedContentType } from '@anthropic/ash-core';
import { verifyRequest } from '../verify.js';
import type {
  ContextStore,
  ExpressRequest,
  ExpressResponse,
  ExpressNextFunction,
  ExpressMiddlewareOptions,
} from '../types.js';

/** Default header names */
const DEFAULT_CONTEXT_ID_HEADER = 'x-ash-context-id';
const DEFAULT_PROOF_HEADER = 'x-ash-proof';

/**
 * Create ASH verification middleware for Express.
 *
 * @param store - Context store to use
 * @param options - Middleware options
 * @returns Express middleware function
 *
 * @example
 * ```typescript
 * app.post('/api/profile/update',
 *   ashMiddleware(store, { expectedBinding: 'POST /api/profile/update' }),
 *   (req, res) => {
 *     // Business logic here - request is verified
 *   }
 * );
 * ```
 */
export function ashMiddleware(
  store: ContextStore,
  options: ExpressMiddlewareOptions
): (req: ExpressRequest, res: ExpressResponse, next: ExpressNextFunction) => Promise<void> {
  const {
    expectedBinding,
    contentType = 'application/json',
    contextIdHeader = DEFAULT_CONTEXT_ID_HEADER,
    proofHeader = DEFAULT_PROOF_HEADER,
  } = options;

  return async (
    req: ExpressRequest,
    res: ExpressResponse,
    next: ExpressNextFunction
  ): Promise<void> => {
    try {
      await verifyRequest(store, req, {
        expectedBinding,
        contentType: contentType as SupportedContentType,
        extractContextId: (r) => getHeader(r as ExpressRequest, contextIdHeader),
        extractProof: (r) => getHeader(r as ExpressRequest, proofHeader),
        extractPayload: (r) => (r as ExpressRequest).body,
      });

      // Verification passed - continue to business logic
      next();
    } catch (error) {
      if (error instanceof AshError) {
        // Return safe error response
        res.status(error.httpStatus).json({
          error: {
            code: error.code,
            message: error.message,
          },
        });
        return;
      }

      // Unexpected error - pass to Express error handler
      next(error);
    }
  };
}

/**
 * Extract a header value from request.
 * Handles both string and string[] cases.
 */
function getHeader(req: ExpressRequest, name: string): string {
  const value = req.headers[name.toLowerCase()];

  if (Array.isArray(value)) {
    return value[0] ?? '';
  }

  return value ?? '';
}

/**
 * Create error handler middleware for ASH errors.
 *
 * @example
 * ```typescript
 * app.use(ashErrorHandler());
 * ```
 */
export function ashErrorHandler(): (
  err: unknown,
  req: ExpressRequest,
  res: ExpressResponse,
  next: ExpressNextFunction
) => void {
  return (
    err: unknown,
    _req: ExpressRequest,
    res: ExpressResponse,
    next: ExpressNextFunction
  ): void => {
    if (err instanceof AshError) {
      res.status(err.httpStatus).json({
        error: {
          code: err.code,
          message: err.message,
        },
      });
      return;
    }

    next(err);
  };
}
