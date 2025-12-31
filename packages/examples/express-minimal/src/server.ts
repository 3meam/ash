/**
 * ASH Protocol - Minimal Express Example
 *
 * Demonstrates:
 * - Context issuance endpoint
 * - Protected endpoint with ASH middleware
 * - Tamper detection
 * - Replay prevention
 */

import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import {
  createContext,
  ashMiddleware,
  MemoryContextStore,
  normalizeBinding,
} from '@anthropic/ash-server';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Initialize Express
const app = express();
app.use(express.json());
app.use(express.static(join(__dirname, '../public')));

// Initialize context store (use Redis/SQL in production!)
const store = new MemoryContextStore({ suppressWarning: true });

// ============================================
// Context Issuance Endpoint
// ============================================
app.post('/ash/context', async (req, res) => {
  try {
    // In production, validate the user is authenticated
    // and rate-limit this endpoint

    const { action } = req.body as { action?: string };

    // Default binding if not specified
    const binding = action ?? 'POST /api/profile/update';

    const ctx = await createContext(store, {
      binding,
      ttlMs: 30_000, // 30 seconds
      mode: 'balanced',
      issueNonce: true, // Enable server-assisted mode
    });

    console.log(`[ASH] Context issued: ${ctx.contextId.slice(0, 8)}... for ${binding}`);

    res.json(ctx);
  } catch (error) {
    console.error('[ASH] Context creation failed:', error);
    res.status(500).json({ error: 'Failed to create context' });
  }
});

// ============================================
// Protected Endpoint - Profile Update
// ============================================
const PROFILE_BINDING = 'POST /api/profile/update';

app.post(
  '/api/profile/update',
  ashMiddleware(store, { expectedBinding: PROFILE_BINDING }),
  (req, res) => {
    // If we reach here, the request has been verified:
    // - Valid context
    // - Not expired
    // - Correct endpoint binding
    // - Payload integrity verified
    // - Not a replay (context consumed)

    const { name, email } = req.body as { name?: string; email?: string };

    console.log(`[API] Profile updated: ${name} <${email}>`);

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: { name, email },
    });
  }
);

// ============================================
// Protected Endpoint - Money Transfer
// ============================================
const TRANSFER_BINDING = 'POST /api/transfer';

app.post(
  '/api/transfer',
  ashMiddleware(store, { expectedBinding: TRANSFER_BINDING }),
  (req, res) => {
    const { to, amount } = req.body as { to?: string; amount?: number };

    console.log(`[API] Transfer: $${amount} to ${to}`);

    res.json({
      success: true,
      message: 'Transfer initiated',
      data: { to, amount, status: 'pending' },
    });
  }
);

// ============================================
// Start Server
// ============================================
const PORT = process.env['PORT'] ?? 3000;

app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════════╗
║  ASH Protocol - Express Example                    ║
║  Server running at http://localhost:${PORT}           ║
║                                                    ║
║  Endpoints:                                        ║
║  POST /ash/context - Get verification context      ║
║  POST /api/profile/update - Protected endpoint     ║
║  POST /api/transfer - Protected endpoint           ║
║                                                    ║
║  Open http://localhost:${PORT} in your browser        ║
╚════════════════════════════════════════════════════╝
`);
});
