import { StoredContext, AshMode, SupportedContentType, ContextPublicInfo, AshError, InvalidContextError, ContextExpiredError, ReplayDetectedError, IntegrityFailedError, EndpointMismatchError, UnsupportedContentTypeError, CanonicalizationError } from '@anthropic/ash-core';
export { ASH_ERROR_HTTP_STATUS, ASH_ERROR_MESSAGES, AshError, AshErrorCode, AshMode, CanonicalizationError, ContextExpiredError, ContextPublicInfo, EndpointMismatchError, IntegrityFailedError, InvalidContextError, ReplayDetectedError, StoredContext, SupportedContentType, UnsupportedContentTypeError } from '@anthropic/ash-core';

/**
 * ASH Server SDK Types
 * @module @anthropic/ash-server
 */

/** Options for creating a context */
interface CreateContextOptions {
    /** Security mode (default: 'balanced') */
    mode?: AshMode;
    /** Time-to-live in milliseconds (recommended < 60000) */
    ttlMs: number;
    /** Canonical binding: "METHOD /path" */
    binding: string;
    /** Whether to issue a nonce (server-assisted mode) */
    issueNonce?: boolean;
}
/** Options for verifying a request */
interface VerifyOptions {
    /** Expected binding for this endpoint */
    expectedBinding: string;
    /** Content type of the request */
    contentType: SupportedContentType;
    /** Extract context ID from request */
    extractContextId: (req: unknown) => string;
    /** Extract proof from request */
    extractProof: (req: unknown) => string;
    /** Extract payload from request (parsed body or raw string) */
    extractPayload: (req: unknown) => unknown;
}
/** Result of atomic consume operation */
type ConsumeResult = 'consumed' | 'already_consumed' | 'missing';
/** Context store interface - implementations MUST support atomic consume */
interface ContextStore {
    /** Store a new context */
    put(ctx: StoredContext): Promise<void>;
    /** Retrieve a context by ID */
    get(contextId: string): Promise<StoredContext | null>;
    /**
     * Atomically consume a context.
     * This MUST be atomic to prevent replay attacks.
     *
     * @param contextId - The context ID to consume
     * @param nowMs - Current timestamp in milliseconds
     * @returns Result of the consume operation
     */
    consume(contextId: string, nowMs: number): Promise<ConsumeResult>;
    /** Clean up expired contexts (optional) */
    cleanup?(): Promise<number>;
}
/** Express-like request interface */
interface ExpressRequest {
    method: string;
    path: string;
    originalUrl?: string;
    headers: Record<string, string | string[] | undefined>;
    body?: unknown;
}
/** Express-like response interface */
interface ExpressResponse {
    status(code: number): this;
    json(body: unknown): void;
}
/** Express-like next function */
type ExpressNextFunction = (err?: unknown) => void;
/** Middleware options for Express */
interface ExpressMiddlewareOptions {
    /** Expected binding for this endpoint */
    expectedBinding: string;
    /** Content type (default: 'application/json') */
    contentType?: SupportedContentType;
    /** Header name for context ID (default: 'x-ash-context-id') */
    contextIdHeader?: string;
    /** Header name for proof (default: 'x-ash-proof') */
    proofHeader?: string;
}

/**
 * ASH Context Management
 *
 * Server-side context issuance for request verification.
 *
 * @module @anthropic/ash-server
 */

/**
 * Create a context manager bound to a store.
 */
declare function createContextManager(store: ContextStore): {
    createContext: (options: CreateContextOptions) => Promise<ContextPublicInfo>;
    getContext: (contextId: string) => Promise<StoredContext | null>;
};
/**
 * Create a new verification context.
 *
 * @param store - The context store to use
 * @param options - Context creation options
 * @returns Public context info to return to client
 */
declare function createContext(store: ContextStore, options: CreateContextOptions): Promise<ContextPublicInfo>;

/**
 * ASH Request Verification Pipeline
 *
 * Fail-closed verification following the ASH-Spec-v1.0 order:
 * 1. Extract contextId
 * 2. Load context
 * 3. Check expiry
 * 4. Verify binding
 * 5. Canonicalize payload
 * 6. Recompute proof
 * 7. Compare proofs (constant-time)
 * 8. Atomic consume
 *
 * @module @anthropic/ash-server
 */

/**
 * Verify a request against ASH protocol.
 *
 * This function implements the verification pipeline exactly as specified.
 * Any failure throws an AshError and stops execution immediately.
 *
 * @param store - Context store
 * @param req - The incoming request
 * @param options - Verification options
 * @throws {AshError} On any verification failure
 */
declare function verifyRequest(store: ContextStore, req: unknown, options: VerifyOptions): Promise<void>;
/**
 * Create a verifier bound to a store.
 */
declare function createVerifier(store: ContextStore): {
    verify: (req: unknown, options: VerifyOptions) => Promise<void>;
};

/**
 * ASH Express Middleware
 *
 * Drop-in middleware for Express.js applications.
 *
 * @module @anthropic/ash-server
 */

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
declare function ashMiddleware(store: ContextStore, options: ExpressMiddlewareOptions): (req: ExpressRequest, res: ExpressResponse, next: ExpressNextFunction) => Promise<void>;
/**
 * Create error handler middleware for ASH errors.
 *
 * @example
 * ```typescript
 * app.use(ashErrorHandler());
 * ```
 */
declare function ashErrorHandler(): (err: unknown, req: ExpressRequest, res: ExpressResponse, next: ExpressNextFunction) => void;

/**
 * ASH Fastify Plugin
 *
 * Plugin for Fastify applications.
 *
 * @module @anthropic/ash-server
 */

/** Fastify instance interface */
interface FastifyInstance {
    decorate(name: string, value: unknown): this;
    addHook(name: string, handler: unknown): this;
}
/**
 * ASH Fastify plugin options
 */
interface AshFastifyPluginOptions {
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
declare function ashPlugin(fastify: FastifyInstance, options: AshFastifyPluginOptions): Promise<void>;

/**
 * In-Memory Context Store
 *
 * WARNING: For development and testing ONLY.
 * NOT suitable for production - no persistence, no atomic guarantees across processes.
 *
 * @module @anthropic/ash-server
 */

/**
 * In-memory context store for development and testing.
 *
 * ⚠️ WARNING: Do NOT use in production!
 * - No persistence across restarts
 * - No atomic guarantees in clustered environments
 * - Memory will grow unbounded without cleanup
 */
declare class MemoryContextStore implements ContextStore {
    private contexts;
    private readonly warnOnUse;
    constructor(options?: {
        suppressWarning?: boolean;
    });
    put(ctx: StoredContext): Promise<void>;
    get(contextId: string): Promise<StoredContext | null>;
    consume(contextId: string, nowMs: number): Promise<ConsumeResult>;
    cleanup(): Promise<number>;
    /** Get current store size (for testing) */
    size(): number;
    /** Clear all contexts (for testing) */
    clear(): void;
}

/**
 * Redis Context Store
 *
 * Production-ready store with atomic consume using Lua scripts.
 *
 * @module @anthropic/ash-server
 */

/** Redis client interface (compatible with ioredis) */
interface RedisClient {
    set(key: string, value: string, mode: 'EX', seconds: number): Promise<'OK' | null>;
    get(key: string): Promise<string | null>;
    del(key: string): Promise<number>;
    eval(script: string, numKeys: number, ...args: string[]): Promise<unknown>;
}
/** Options for RedisContextStore */
interface RedisContextStoreOptions {
    /** Redis client instance */
    client: RedisClient;
    /** Key prefix (default: 'ash:ctx:') */
    keyPrefix?: string;
}
/**
 * Redis-backed context store for production use.
 *
 * Features:
 * - Atomic consume using Lua scripts
 * - Automatic expiration via Redis TTL
 * - Cluster-safe
 */
declare class RedisContextStore implements ContextStore {
    private readonly client;
    private readonly keyPrefix;
    constructor(options: RedisContextStoreOptions);
    private key;
    put(ctx: StoredContext): Promise<void>;
    get(contextId: string): Promise<StoredContext | null>;
    consume(contextId: string, nowMs: number): Promise<ConsumeResult>;
    cleanup(): Promise<number>;
}

/**
 * SQL Context Store
 *
 * Production-ready store with atomic consume using row-level locking.
 *
 * @module @anthropic/ash-server
 */

/** Generic SQL query interface */
interface SqlQuery {
    (sql: string, params?: unknown[]): Promise<{
        rows: unknown[];
        rowCount: number;
    }>;
}
/** Options for SqlContextStore */
interface SqlContextStoreOptions {
    /** SQL query function */
    query: SqlQuery;
    /** Table name (default: 'ash_contexts') */
    tableName?: string;
}
/**
 * SQL-backed context store for production use.
 *
 * Requires a table with the following schema:
 * ```sql
 * CREATE TABLE ash_contexts (
 *   context_id VARCHAR(64) PRIMARY KEY,
 *   binding VARCHAR(255) NOT NULL,
 *   mode VARCHAR(20) NOT NULL,
 *   issued_at BIGINT NOT NULL,
 *   expires_at BIGINT NOT NULL,
 *   nonce VARCHAR(64),
 *   consumed_at BIGINT
 * );
 *
 * CREATE INDEX idx_ash_contexts_expires ON ash_contexts(expires_at);
 * ```
 *
 * Features:
 * - Atomic consume using UPDATE ... WHERE consumed_at IS NULL
 * - Works with PostgreSQL, MySQL, SQLite
 */
declare class SqlContextStore implements ContextStore {
    private readonly query;
    private readonly tableName;
    constructor(options: SqlContextStoreOptions);
    put(ctx: StoredContext): Promise<void>;
    get(contextId: string): Promise<StoredContext | null>;
    consume(contextId: string, nowMs: number): Promise<ConsumeResult>;
    cleanup(): Promise<number>;
    private rowToContext;
}

/**
 * ASH Protocol Server SDK
 *
 * Server-side context management and request verification.
 *
 * Ash was developed by 3maem Co. | شركة عمائم @ 12/31/2025
 *
 * @packageDocumentation
 * @module @anthropic/ash-server
 */

/**
 * ASH Server Namespace
 *
 * All ASH server functionality accessible via `ash.` prefix.
 *
 * @example
 * ```typescript
 * import ash from '@anthropic/ash-server';
 *
 * const store = new ash.stores.Memory();
 * const ctx = await ash.context.create(store, { binding: 'POST /api', ttlMs: 30000 });
 * await ash.verify(store, req, { expectedBinding: 'POST /api' });
 * ```
 */
declare const ash: {
    /** Version of the ASH protocol */
    readonly version: "1.0.0";
    /** Context management */
    readonly context: {
        /** Create a new context */
        readonly create: typeof createContext;
        /** Create a context manager */
        readonly createManager: typeof createContextManager;
    };
    /** Verify a request */
    readonly verify: typeof verifyRequest;
    /** Create a reusable verifier */
    readonly createVerifier: typeof createVerifier;
    /** Middleware for web frameworks */
    readonly middleware: {
        /** Express.js middleware */
        readonly express: typeof ashMiddleware;
        /** Express.js error handler */
        readonly expressErrorHandler: typeof ashErrorHandler;
        /** Fastify plugin */
        readonly fastify: typeof ashPlugin;
    };
    /** Context stores */
    readonly stores: {
        /** In-memory store (development only) */
        readonly Memory: typeof MemoryContextStore;
        /** Redis store (production) */
        readonly Redis: typeof RedisContextStore;
        /** SQL store (production) */
        readonly Sql: typeof SqlContextStore;
    };
    /** Error classes */
    readonly errors: {
        readonly AshError: typeof AshError;
        readonly InvalidContextError: typeof InvalidContextError;
        readonly ContextExpiredError: typeof ContextExpiredError;
        readonly ReplayDetectedError: typeof ReplayDetectedError;
        readonly IntegrityFailedError: typeof IntegrityFailedError;
        readonly EndpointMismatchError: typeof EndpointMismatchError;
        readonly UnsupportedContentTypeError: typeof UnsupportedContentTypeError;
        readonly CanonicalizationError: typeof CanonicalizationError;
    };
};

export { type AshFastifyPluginOptions, type ConsumeResult, type ContextStore, type CreateContextOptions, type ExpressMiddlewareOptions, type ExpressNextFunction, type ExpressRequest, type ExpressResponse, MemoryContextStore, type RedisClient, RedisContextStore, type RedisContextStoreOptions, SqlContextStore, type SqlContextStoreOptions, type SqlQuery, type VerifyOptions, ashErrorHandler, ashMiddleware, ashPlugin, createContext, createContextManager, createVerifier, ash as default, verifyRequest };
