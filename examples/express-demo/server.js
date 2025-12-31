/**
 * ASH Protocol Demo Server
 *
 * Ash was developed by 3maem Co. | شركة عمائم @ 12/31/2025
 *
 * This example demonstrates:
 * 1. Context issuance - Server creates time-limited verification contexts
 * 2. Request verification - Middleware verifies integrity proofs
 * 3. Tamper detection - Modified payloads are rejected
 * 4. Replay detection - Reused contexts are rejected (one-time use)
 *
 * Run: npm start
 * Open: http://localhost:3000
 */

import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// ASH Server SDK - using ash.* namespace for brand visibility
import ash from '@anthropic/ash-server';

// Get directory for static files
const __dirname = dirname(fileURLToPath(import.meta.url));

// Initialize Express app
const app = express();
app.use(express.json());

// Create in-memory context store (use ash.stores.Redis in production!)
const store = new ash.stores.Memory({ suppressWarning: true });

// Serve static files (client HTML)
app.use(express.static(join(__dirname, 'public')));

// ============================================================
// ENDPOINT: Issue Context
// Client calls this before making a protected request
// ============================================================
app.post('/ash/context', async (req, res) => {
  try {
    // Create a context for the upcoming request
    // binding: "METHOD /path" - ties context to specific endpoint
    // ttlMs: Time-to-live in milliseconds (30 seconds here)
    const context = await ash.context.create(store, {
      binding: 'POST /api/profile/update',
      ttlMs: 30000, // 30 seconds
      issueNonce: true, // Enable server-assisted mode for extra security
    });

    console.log(`[ASH] Context issued: ${context.contextId}`);

    res.json(context);
  } catch (error) {
    console.error('[ASH] Context creation failed:', error);
    res.status(500).json({ error: 'Failed to create context' });
  }
});

// ============================================================
// ENDPOINT: Protected Profile Update
// ASH middleware verifies request integrity before handler runs
// ============================================================
app.post(
  '/api/profile/update',
  // ASH verification middleware
  // Checks: context validity, expiry, binding, payload integrity, replay
  ash.middleware.express(store, {
    expectedBinding: 'POST /api/profile/update',
    contentType: 'application/json',
  }),
  // Business logic - only runs if verification passes
  (req, res) => {
    const { name, email } = req.body;

    console.log(`[API] Profile updated: name=${name}, email=${email}`);

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: { name, email },
    });
  }
);

// ============================================================
// DEMO ENDPOINTS: Test attack scenarios
// ============================================================

// Tamper test - server receives modified payload
app.post('/demo/tamper-test', async (req, res) => {
  // This simulates what happens when an attacker modifies the payload
  // The proof was computed with original data, so verification fails
  res.json({
    scenario: 'TAMPER_DETECTION',
    explanation: 'Modify the payload after proof is computed. Server rejects because proof doesn\'t match.',
  });
});

// Replay test - server receives same context twice
app.post('/demo/replay-test', async (req, res) => {
  // This simulates a replay attack
  // The context is consumed on first use, subsequent uses are rejected
  res.json({
    scenario: 'REPLAY_DETECTION',
    explanation: 'Send same valid request twice. First succeeds, second fails with REPLAY_DETECTED.',
  });
});

// ============================================================
// Error handling
// ============================================================
app.use((err, req, res, next) => {
  console.error('[ERROR]', err.message);
  res.status(500).json({ error: 'Internal server error' });
});

// ============================================================
// Start server
// ============================================================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════════════╗
║           ASH Protocol Demo Server                        ║
║           by 3maem Co. | شركة عمائم                       ║
╠═══════════════════════════════════════════════════════════╣
║  Server running at: http://localhost:${PORT}                 ║
║                                                           ║
║  Open in browser to test:                                 ║
║  • Normal request flow                                    ║
║  • Tamper detection (modify payload)                      ║
║  • Replay detection (send same request twice)             ║
╚═══════════════════════════════════════════════════════════╝
  `);
});
