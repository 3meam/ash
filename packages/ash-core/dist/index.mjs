// src/errors.ts
var ASH_ERROR_HTTP_STATUS = {
  ASH_INVALID_CONTEXT: 400,
  ASH_CONTEXT_EXPIRED: 410,
  ASH_REPLAY_DETECTED: 409,
  ASH_INTEGRITY_FAILED: 400,
  ASH_ENDPOINT_MISMATCH: 400,
  ASH_MODE_VIOLATION: 400,
  ASH_UNSUPPORTED_CONTENT_TYPE: 400,
  ASH_MALFORMED_REQUEST: 400,
  ASH_CANONICALIZATION_FAILED: 400
};
var ASH_ERROR_MESSAGES = {
  ASH_INVALID_CONTEXT: "Context not found. Request a new context.",
  ASH_CONTEXT_EXPIRED: "Context expired. Request a new context.",
  ASH_REPLAY_DETECTED: "Request already processed. Use a new context.",
  ASH_INTEGRITY_FAILED: "Payload integrity check failed.",
  ASH_ENDPOINT_MISMATCH: "Request sent to wrong endpoint.",
  ASH_MODE_VIOLATION: "Security mode requirements not met.",
  ASH_UNSUPPORTED_CONTENT_TYPE: "Content type not supported.",
  ASH_MALFORMED_REQUEST: "Request format is invalid.",
  ASH_CANONICALIZATION_FAILED: "Failed to canonicalize payload."
};
var AshError = class _AshError extends Error {
  code;
  httpStatus;
  constructor(code, message) {
    super(message ?? ASH_ERROR_MESSAGES[code]);
    this.name = "AshError";
    this.code = code;
    this.httpStatus = ASH_ERROR_HTTP_STATUS[code];
    if (Error.captureStackTrace !== void 0) {
      Error.captureStackTrace(this, _AshError);
    }
  }
  /** Convert to safe JSON (no sensitive data) */
  toJSON() {
    return {
      code: this.code,
      message: this.message,
      httpStatus: this.httpStatus
    };
  }
};
var InvalidContextError = class extends AshError {
  constructor(message) {
    super("ASH_INVALID_CONTEXT", message);
    this.name = "InvalidContextError";
  }
};
var ContextExpiredError = class extends AshError {
  constructor(message) {
    super("ASH_CONTEXT_EXPIRED", message);
    this.name = "ContextExpiredError";
  }
};
var ReplayDetectedError = class extends AshError {
  constructor(message) {
    super("ASH_REPLAY_DETECTED", message);
    this.name = "ReplayDetectedError";
  }
};
var IntegrityFailedError = class extends AshError {
  constructor(message) {
    super("ASH_INTEGRITY_FAILED", message);
    this.name = "IntegrityFailedError";
  }
};
var EndpointMismatchError = class extends AshError {
  constructor(message) {
    super("ASH_ENDPOINT_MISMATCH", message);
    this.name = "EndpointMismatchError";
  }
};
var UnsupportedContentTypeError = class extends AshError {
  constructor(message) {
    super("ASH_UNSUPPORTED_CONTENT_TYPE", message);
    this.name = "UnsupportedContentTypeError";
  }
};
var CanonicalizationError = class extends AshError {
  constructor(message) {
    super("ASH_CANONICALIZATION_FAILED", message);
    this.name = "CanonicalizationError";
  }
};

// src/canonicalize.ts
function canonicalizeJson(value) {
  return buildCanonicalJson(canonicalizeValue(value));
}
function buildCanonicalJson(value) {
  if (value === null) {
    return "null";
  }
  const type = typeof value;
  if (type === "string") {
    return JSON.stringify(value);
  }
  if (type === "boolean") {
    return value ? "true" : "false";
  }
  if (type === "number") {
    return String(value);
  }
  if (Array.isArray(value)) {
    const items = value.map((item) => buildCanonicalJson(item));
    return "[" + items.join(",") + "]";
  }
  if (type === "object") {
    const obj = value;
    const sortedKeys = Object.keys(obj).sort((a, b) => {
      if (a < b) return -1;
      if (a > b) return 1;
      return 0;
    });
    const pairs = sortedKeys.map((key) => {
      return JSON.stringify(key) + ":" + buildCanonicalJson(obj[key]);
    });
    return "{" + pairs.join(",") + "}";
  }
  throw new CanonicalizationError(`Cannot serialize type: ${type}`);
}
function canonicalizeValue(value) {
  if (value === null) {
    return null;
  }
  if (value === void 0) {
    throw new CanonicalizationError("undefined values are not allowed");
  }
  const type = typeof value;
  if (type === "string") {
    return value.normalize("NFC");
  }
  if (type === "boolean") {
    return value;
  }
  if (type === "number") {
    return canonicalizeNumber(value);
  }
  if (type === "bigint") {
    throw new CanonicalizationError("BigInt values are not supported");
  }
  if (type === "symbol") {
    throw new CanonicalizationError("Symbol values are not supported");
  }
  if (type === "function") {
    throw new CanonicalizationError("Function values are not supported");
  }
  if (Array.isArray(value)) {
    return value.map((item) => canonicalizeValue(item));
  }
  if (type === "object") {
    const obj = value;
    const sortedKeys = Object.keys(obj).sort();
    const result = {};
    for (const key of sortedKeys) {
      const val = obj[key];
      if (val !== void 0) {
        const normalizedKey = key.normalize("NFC");
        result[normalizedKey] = canonicalizeValue(val);
      }
    }
    return result;
  }
  throw new CanonicalizationError(`Unsupported type: ${type}`);
}
function canonicalizeNumber(num) {
  if (Number.isNaN(num)) {
    throw new CanonicalizationError("NaN values are not allowed");
  }
  if (!Number.isFinite(num)) {
    throw new CanonicalizationError("Infinity values are not allowed");
  }
  if (Object.is(num, -0)) {
    return 0;
  }
  return num;
}
function canonicalizeUrlEncoded(input) {
  let pairs;
  if (typeof input === "string") {
    pairs = parseUrlEncoded(input);
  } else {
    pairs = objectToPairs(input);
  }
  const normalizedPairs = pairs.map(([key, value]) => [
    key.normalize("NFC"),
    value.normalize("NFC")
  ]);
  normalizedPairs.sort((a, b) => {
    if (a[0] < b[0]) return -1;
    if (a[0] > b[0]) return 1;
    return 0;
  });
  return normalizedPairs.map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`).join("&");
}
function parseUrlEncoded(input) {
  if (input === "") {
    return [];
  }
  const pairs = [];
  for (const part of input.split("&")) {
    if (part === "") {
      continue;
    }
    const normalizedPart = part.replace(/\+/g, " ");
    const eqIndex = normalizedPart.indexOf("=");
    if (eqIndex === -1) {
      const key = decodeURIComponent(normalizedPart);
      if (key !== "") {
        pairs.push([key, ""]);
      }
    } else {
      const key = decodeURIComponent(normalizedPart.slice(0, eqIndex));
      const value = decodeURIComponent(normalizedPart.slice(eqIndex + 1));
      if (key !== "") {
        pairs.push([key, value]);
      }
    }
  }
  return pairs;
}
function objectToPairs(obj) {
  const pairs = [];
  for (const [key, value] of Object.entries(obj)) {
    if (Array.isArray(value)) {
      for (const v of value) {
        pairs.push([key, v]);
      }
    } else {
      pairs.push([key, value]);
    }
  }
  return pairs;
}
function normalizeBinding(method, path) {
  const normalizedMethod = method.toUpperCase();
  const fragmentIndex = path.indexOf("#");
  let normalizedPath = fragmentIndex === -1 ? path : path.slice(0, fragmentIndex);
  const queryIndex = normalizedPath.indexOf("?");
  normalizedPath = queryIndex === -1 ? normalizedPath : normalizedPath.slice(0, queryIndex);
  if (!normalizedPath.startsWith("/")) {
    normalizedPath = "/" + normalizedPath;
  }
  normalizedPath = normalizedPath.replace(/\/+/g, "/");
  if (normalizedPath.length > 1 && normalizedPath.endsWith("/")) {
    normalizedPath = normalizedPath.slice(0, -1);
  }
  return `${normalizedMethod} ${normalizedPath}`;
}

// src/proof.ts
import { createHash } from "crypto";
var ASH_VERSION_PREFIX = "ASHv1";
function buildProof(input) {
  const { mode, binding, contextId, nonce, canonicalPayload } = input;
  let proofInput = `${ASH_VERSION_PREFIX}
${mode}
${binding}
${contextId}
`;
  if (nonce !== void 0 && nonce !== "") {
    proofInput += `${nonce}
`;
  }
  proofInput += canonicalPayload;
  const hash = createHash("sha256").update(proofInput, "utf8").digest();
  return base64UrlEncode(hash);
}
function base64UrlEncode(buffer) {
  return buffer.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}
function base64UrlDecode(input) {
  let base64 = input.replace(/-/g, "+").replace(/_/g, "/");
  const padLength = (4 - base64.length % 4) % 4;
  base64 += "=".repeat(padLength);
  return Buffer.from(base64, "base64");
}

// src/compare.ts
import { timingSafeEqual } from "crypto";
function timingSafeCompare(a, b) {
  const bufA = Buffer.from(a, "utf8");
  const bufB = Buffer.from(b, "utf8");
  if (bufA.length !== bufB.length) {
    timingSafeEqual(bufA, bufA);
    return false;
  }
  return timingSafeEqual(bufA, bufB);
}
function timingSafeCompareBuffers(a, b) {
  if (a.length !== b.length) {
    timingSafeEqual(a, a);
    return false;
  }
  return timingSafeEqual(a, b);
}
export {
  ASH_ERROR_HTTP_STATUS,
  ASH_ERROR_MESSAGES,
  AshError,
  CanonicalizationError,
  ContextExpiredError,
  EndpointMismatchError,
  IntegrityFailedError,
  InvalidContextError,
  ReplayDetectedError,
  UnsupportedContentTypeError,
  base64UrlDecode,
  buildProof,
  canonicalizeJson,
  canonicalizeUrlEncoded,
  normalizeBinding,
  timingSafeCompare,
  timingSafeCompareBuffers
};
