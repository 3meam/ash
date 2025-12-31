"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var index_exports = {};
__export(index_exports, {
  ashFetch: () => ashFetch,
  buildProof: () => buildProof,
  canonicalizeJson: () => import_ash_core.canonicalizeJson,
  canonicalizeUrlEncoded: () => import_ash_core.canonicalizeUrlEncoded,
  createAshHeaders: () => createAshHeaders,
  default: () => index_default,
  normalizeBinding: () => import_ash_core.normalizeBinding
});
module.exports = __toCommonJS(index_exports);

// src/client.ts
var import_ash_core = require("@anthropic/ash-core");
var ASH_VERSION_PREFIX = "ASHv1";
async function buildProofBrowser(input) {
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
  const encoder = new TextEncoder();
  const data = encoder.encode(proofInput);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return base64UrlEncode(new Uint8Array(hashBuffer));
}
async function buildProofNode(input) {
  const { createHash } = await import("crypto");
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
  return hash.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}
function base64UrlEncode(bytes) {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  const base64 = btoa(binary);
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}
function isBrowser() {
  return typeof window !== "undefined" && typeof window.crypto !== "undefined" && typeof window.crypto.subtle !== "undefined";
}
async function buildProof(input) {
  if (isBrowser()) {
    return buildProofBrowser(input);
  }
  return buildProofNode(input);
}
async function createAshHeaders(options) {
  const {
    context,
    payload,
    method,
    path,
    contextIdHeader = "X-ASH-Context-Id",
    proofHeader = "X-ASH-Proof"
  } = options;
  const canonicalPayload = (0, import_ash_core.canonicalizeJson)(payload);
  const binding = (0, import_ash_core.normalizeBinding)(method, path);
  const proof = await buildProof({
    mode: context.mode,
    binding,
    contextId: context.contextId,
    nonce: context.nonce,
    canonicalPayload
  });
  return {
    [contextIdHeader]: context.contextId,
    [proofHeader]: proof,
    "Content-Type": "application/json"
  };
}
async function ashFetch(url, options) {
  const { payload, method, fetchOptions = {} } = options;
  const ashHeaders = await createAshHeaders(options);
  const headers = new Headers(fetchOptions.headers);
  for (const [key, value] of Object.entries(ashHeaders)) {
    headers.set(key, value);
  }
  return fetch(url, {
    ...fetchOptions,
    method,
    headers,
    body: JSON.stringify(payload)
  });
}

// src/index.ts
var ash = {
  /** Version of the ASH protocol */
  version: "1.0.0",
  /** Proof generation */
  proof: {
    /** Build a cryptographic proof */
    build: buildProof
  },
  /** Create ASH headers for a request */
  createHeaders: createAshHeaders,
  /** Fetch wrapper with automatic ASH headers */
  fetch: ashFetch,
  /** Canonicalization functions */
  canonicalize: {
    /** Canonicalize JSON data */
    json: import_ash_core.canonicalizeJson,
    /** Canonicalize URL-encoded data */
    urlEncoded: import_ash_core.canonicalizeUrlEncoded,
    /** Normalize HTTP binding (method + path) */
    binding: import_ash_core.normalizeBinding
  }
};
var index_default = ash;
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  ashFetch,
  buildProof,
  canonicalizeJson,
  canonicalizeUrlEncoded,
  createAshHeaders,
  normalizeBinding
});
