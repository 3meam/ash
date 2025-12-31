// src/index.ts
import {
  AshError as AshError3,
  InvalidContextError as InvalidContextError2,
  ContextExpiredError as ContextExpiredError2,
  ReplayDetectedError as ReplayDetectedError2,
  IntegrityFailedError as IntegrityFailedError2,
  EndpointMismatchError as EndpointMismatchError2,
  UnsupportedContentTypeError as UnsupportedContentTypeError2,
  CanonicalizationError,
  ASH_ERROR_HTTP_STATUS,
  ASH_ERROR_MESSAGES
} from "@anthropic/ash-core";

// src/context.ts
import { randomBytes } from "crypto";
var DEFAULT_MODE = "balanced";
var CONTEXT_ID_BYTES = 16;
var NONCE_BYTES = 16;
function generateSecureId(bytes) {
  return randomBytes(bytes).toString("base64url");
}
function createContextManager(store) {
  return {
    createContext: (options) => createContext(store, options),
    getContext: (contextId) => store.get(contextId)
  };
}
async function createContext(store, options) {
  const { binding, ttlMs, mode = DEFAULT_MODE, issueNonce = false } = options;
  const now = Date.now();
  const contextId = generateSecureId(CONTEXT_ID_BYTES);
  const nonce = issueNonce ? generateSecureId(NONCE_BYTES) : void 0;
  const storedContext = {
    contextId,
    binding,
    mode,
    issuedAt: now,
    expiresAt: now + ttlMs,
    nonce,
    consumedAt: null
  };
  await store.put(storedContext);
  const publicInfo = {
    contextId,
    expiresAt: storedContext.expiresAt,
    mode
  };
  if (nonce !== void 0) {
    publicInfo.nonce = nonce;
  }
  return publicInfo;
}

// src/verify.ts
import {
  canonicalizeJson,
  canonicalizeUrlEncoded,
  buildProof,
  timingSafeCompare,
  InvalidContextError,
  ContextExpiredError,
  EndpointMismatchError,
  IntegrityFailedError,
  ReplayDetectedError,
  UnsupportedContentTypeError
} from "@anthropic/ash-core";
async function verifyRequest(store, req, options) {
  const { expectedBinding, contentType, extractContextId, extractProof, extractPayload } = options;
  const contextId = extractContextId(req);
  if (typeof contextId !== "string" || contextId === "") {
    throw new InvalidContextError("Missing or invalid context ID");
  }
  const context = await store.get(contextId);
  if (context === null) {
    throw new InvalidContextError();
  }
  const now = Date.now();
  if (context.expiresAt <= now) {
    throw new ContextExpiredError();
  }
  if (context.binding !== expectedBinding) {
    throw new EndpointMismatchError();
  }
  const payload = extractPayload(req);
  const canonicalPayload = canonicalizePayload(payload, contentType);
  const expectedProof = buildProof({
    mode: context.mode,
    binding: context.binding,
    contextId: context.contextId,
    nonce: context.nonce,
    canonicalPayload
  });
  const providedProof = extractProof(req);
  if (typeof providedProof !== "string" || !timingSafeCompare(expectedProof, providedProof)) {
    throw new IntegrityFailedError();
  }
  const consumeResult = await store.consume(contextId, now);
  if (consumeResult === "already_consumed") {
    throw new ReplayDetectedError();
  }
  if (consumeResult === "missing") {
    throw new InvalidContextError();
  }
}
function canonicalizePayload(payload, contentType) {
  switch (contentType) {
    case "application/json":
      return canonicalizeJson(payload);
    case "application/x-www-form-urlencoded":
      if (typeof payload === "string") {
        return canonicalizeUrlEncoded(payload);
      }
      if (typeof payload === "object" && payload !== null) {
        return canonicalizeUrlEncoded(payload);
      }
      throw new UnsupportedContentTypeError("Invalid payload for URL-encoded content type");
    default:
      throw new UnsupportedContentTypeError(`Content type not supported: ${contentType}`);
  }
}
function createVerifier(store) {
  return {
    verify: (req, options) => verifyRequest(store, req, options)
  };
}

// src/middleware/express.ts
import { AshError } from "@anthropic/ash-core";
var DEFAULT_CONTEXT_ID_HEADER = "x-ash-context-id";
var DEFAULT_PROOF_HEADER = "x-ash-proof";
function ashMiddleware(store, options) {
  const {
    expectedBinding,
    contentType = "application/json",
    contextIdHeader = DEFAULT_CONTEXT_ID_HEADER,
    proofHeader = DEFAULT_PROOF_HEADER
  } = options;
  return async (req, res, next) => {
    try {
      await verifyRequest(store, req, {
        expectedBinding,
        contentType,
        extractContextId: (r) => getHeader(r, contextIdHeader),
        extractProof: (r) => getHeader(r, proofHeader),
        extractPayload: (r) => r.body
      });
      next();
    } catch (error) {
      if (error instanceof AshError) {
        res.status(error.httpStatus).json({
          error: {
            code: error.code,
            message: error.message
          }
        });
        return;
      }
      next(error);
    }
  };
}
function getHeader(req, name) {
  const value = req.headers[name.toLowerCase()];
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }
  return value ?? "";
}
function ashErrorHandler() {
  return (err, _req, res, next) => {
    if (err instanceof AshError) {
      res.status(err.httpStatus).json({
        error: {
          code: err.code,
          message: err.message
        }
      });
      return;
    }
    next(err);
  };
}

// src/middleware/fastify.ts
import { AshError as AshError2 } from "@anthropic/ash-core";
var DEFAULT_CONTEXT_ID_HEADER2 = "x-ash-context-id";
var DEFAULT_PROOF_HEADER2 = "x-ash-proof";
async function ashPlugin(fastify, options) {
  const { store } = options;
  fastify.decorate(
    "ashVerify",
    (verifyOptions) => async (request, reply) => {
      const {
        expectedBinding,
        contentType = "application/json",
        contextIdHeader = DEFAULT_CONTEXT_ID_HEADER2,
        proofHeader = DEFAULT_PROOF_HEADER2
      } = verifyOptions;
      try {
        await verifyRequest(store, request, {
          expectedBinding,
          contentType,
          extractContextId: (r) => getHeader2(r, contextIdHeader),
          extractProof: (r) => getHeader2(r, proofHeader),
          extractPayload: (r) => r.body
        });
      } catch (error) {
        if (error instanceof AshError2) {
          reply.code(error.httpStatus).send({
            error: {
              code: error.code,
              message: error.message
            }
          });
          return;
        }
        throw error;
      }
    }
  );
}
function getHeader2(req, name) {
  const value = req.headers[name.toLowerCase()];
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }
  return value ?? "";
}

// src/stores/memory.ts
var MemoryContextStore = class {
  contexts = /* @__PURE__ */ new Map();
  warnOnUse;
  constructor(options) {
    this.warnOnUse = !(options?.suppressWarning ?? false);
    if (this.warnOnUse && process.env["NODE_ENV"] === "production") {
      console.warn(
        "[ASH WARNING] MemoryContextStore is not suitable for production. Use RedisContextStore or SqlContextStore instead."
      );
    }
  }
  async put(ctx) {
    this.contexts.set(ctx.contextId, { ...ctx });
  }
  async get(contextId) {
    const ctx = this.contexts.get(contextId);
    return ctx ? { ...ctx } : null;
  }
  async consume(contextId, nowMs) {
    const ctx = this.contexts.get(contextId);
    if (ctx === void 0) {
      return "missing";
    }
    if (ctx.consumedAt !== null && ctx.consumedAt !== void 0) {
      return "already_consumed";
    }
    ctx.consumedAt = nowMs;
    return "consumed";
  }
  async cleanup() {
    const now = Date.now();
    let removed = 0;
    for (const [id, ctx] of this.contexts) {
      if (ctx.expiresAt < now || ctx.consumedAt !== null) {
        this.contexts.delete(id);
        removed++;
      }
    }
    return removed;
  }
  /** Get current store size (for testing) */
  size() {
    return this.contexts.size;
  }
  /** Clear all contexts (for testing) */
  clear() {
    this.contexts.clear();
  }
};

// src/stores/redis.ts
var CONSUME_SCRIPT = `
local key = KEYS[1]
local nowMs = ARGV[1]

local data = redis.call('GET', key)
if not data then
  return -1
end

local ctx = cjson.decode(data)
if ctx.consumedAt then
  return 0
end

ctx.consumedAt = tonumber(nowMs)
redis.call('SET', key, cjson.encode(ctx), 'KEEPTTL')
return 1
`;
var RedisContextStore = class {
  client;
  keyPrefix;
  constructor(options) {
    this.client = options.client;
    this.keyPrefix = options.keyPrefix ?? "ash:ctx:";
  }
  key(contextId) {
    return `${this.keyPrefix}${contextId}`;
  }
  async put(ctx) {
    const ttlSeconds = Math.ceil((ctx.expiresAt - Date.now()) / 1e3);
    if (ttlSeconds <= 0) {
      return;
    }
    await this.client.set(this.key(ctx.contextId), JSON.stringify(ctx), "EX", ttlSeconds);
  }
  async get(contextId) {
    const data = await this.client.get(this.key(contextId));
    if (data === null) {
      return null;
    }
    return JSON.parse(data);
  }
  async consume(contextId, nowMs) {
    const result = await this.client.eval(
      CONSUME_SCRIPT,
      1,
      this.key(contextId),
      nowMs.toString()
    );
    switch (result) {
      case 1:
        return "consumed";
      case 0:
        return "already_consumed";
      default:
        return "missing";
    }
  }
  async cleanup() {
    return 0;
  }
};

// src/stores/sql.ts
var SqlContextStore = class {
  query;
  tableName;
  constructor(options) {
    this.query = options.query;
    this.tableName = options.tableName ?? "ash_contexts";
  }
  async put(ctx) {
    const sql = `
      INSERT INTO ${this.tableName}
        (context_id, binding, mode, issued_at, expires_at, nonce, consumed_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
    `;
    await this.query(sql, [
      ctx.contextId,
      ctx.binding,
      ctx.mode,
      ctx.issuedAt,
      ctx.expiresAt,
      ctx.nonce ?? null,
      ctx.consumedAt ?? null
    ]);
  }
  async get(contextId) {
    const sql = `SELECT * FROM ${this.tableName} WHERE context_id = $1`;
    const result = await this.query(sql, [contextId]);
    if (result.rows.length === 0) {
      return null;
    }
    return this.rowToContext(result.rows[0]);
  }
  async consume(contextId, nowMs) {
    const sql = `
      UPDATE ${this.tableName}
      SET consumed_at = $1
      WHERE context_id = $2 AND consumed_at IS NULL
    `;
    const result = await this.query(sql, [nowMs, contextId]);
    if (result.rowCount === 1) {
      return "consumed";
    }
    const existsResult = await this.query(
      `SELECT consumed_at FROM ${this.tableName} WHERE context_id = $1`,
      [contextId]
    );
    if (existsResult.rows.length === 0) {
      return "missing";
    }
    return "already_consumed";
  }
  async cleanup() {
    const sql = `DELETE FROM ${this.tableName} WHERE expires_at < $1`;
    const result = await this.query(sql, [Date.now()]);
    return result.rowCount;
  }
  rowToContext(row) {
    return {
      contextId: row.context_id,
      binding: row.binding,
      mode: row.mode,
      issuedAt: Number(row.issued_at),
      expiresAt: Number(row.expires_at),
      nonce: row.nonce ?? void 0,
      consumedAt: row.consumed_at !== null ? Number(row.consumed_at) : null
    };
  }
};
export {
  ASH_ERROR_HTTP_STATUS,
  ASH_ERROR_MESSAGES,
  AshError3 as AshError,
  CanonicalizationError,
  ContextExpiredError2 as ContextExpiredError,
  EndpointMismatchError2 as EndpointMismatchError,
  IntegrityFailedError2 as IntegrityFailedError,
  InvalidContextError2 as InvalidContextError,
  MemoryContextStore,
  RedisContextStore,
  ReplayDetectedError2 as ReplayDetectedError,
  SqlContextStore,
  UnsupportedContentTypeError2 as UnsupportedContentTypeError,
  ashErrorHandler,
  ashMiddleware,
  ashPlugin,
  createContext,
  createContextManager,
  createVerifier,
  verifyRequest
};
