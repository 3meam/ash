/**
 * ASH Fastify Plugin
 *
 * Plugin for Fastify applications.
 *
 * @module @anthropic/ash-server
 */

import { AshError } from '@anthropic/ash-core';
import type { SupportedContentType } from '@anthropic/ash-core';
import { verifyRequest } from '../verify.js';
import type { ContextStore, ExpressMiddlewareOptions } from '../types.js';

/** Fastify request interface */
interface FastifyRequest {
  method: string;
  url: string;
  headers: Record<string, string | string[] | undefined>;
  body?: unknown;
}

/** Fastify reply interface */
interface FastifyReply {
  code(statusCode: number): this;
  send(payload?: unknown): this;
}

/** Fastify instance interface */
interface FastifyInstance {
  decorate(name: string, value: unknown): this;
  addHook(name: string, handler: unknown): this;
}

/** Default header names */
const DEFAULT_CONTEXT_ID_HEADER = 'x-ash-context-id';
const DEFAULT_PROOF_HEADER = 'x-ash-proof';

/**
 * ASH Fastify plugin options
 */
export interface AshFastifyPluginOptions {
  /** Context store to use */
  store: ContextStore;
}

/**
 * Create ASH plugin for Fastify.
 *
 * @param fastify - Fastify instance
 * @param options - Plugin options
 *
 * @example
 * ```typescript
 * fastify.register(ashPlugin, { store });
 *
 * fastify.post('/api/profile/update', {
 *   preHandler: fastify.ashVerify({ expectedBinding: 'POST /api/profile/update' })
 * }, handler);
 * ```
 */
export async function ashPlugin(
  fastify: FastifyInstance,
  options: AshFastifyPluginOptions
): Promise<void> {
  const { store } = options;

  // Decorate fastify with ashVerify helper
  fastify.decorate(
    'ashVerify',
    (verifyOptions: ExpressMiddlewareOptions) =>
      async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
        const {
          expectedBinding,
          contentType = 'application/json',
          contextIdHeader = DEFAULT_CONTEXT_ID_HEADER,
          proofHeader = DEFAULT_PROOF_HEADER,
        } = verifyOptions;

        try {
          await verifyRequest(store, request, {
            expectedBinding,
            contentType: contentType as SupportedContentType,
            extractContextId: (r) => getHeader(r as FastifyRequest, contextIdHeader),
            extractProof: (r) => getHeader(r as FastifyRequest, proofHeader),
            extractPayload: (r) => (r as FastifyRequest).body,
          });
        } catch (error) {
          if (error instanceof AshError) {
            reply.code(error.httpStatus).send({
              error: {
                code: error.code,
                message: error.message,
              },
            });
            return;
          }
          throw error;
        }
      }
  );
}

/**
 * Extract a header value from request.
 */
function getHeader(req: FastifyRequest, name: string): string {
  const value = req.headers[name.toLowerCase()];

  if (Array.isArray(value)) {
    return value[0] ?? '';
  }

  return value ?? '';
}
