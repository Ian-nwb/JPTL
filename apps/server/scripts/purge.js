/**
 * JPTL - Database Purge Script
 * -----------------------------
 * ⚠ WARNING: This permanently deletes ALL data from every collection.
 *
 * Usage (inside the container):
 *   bun run purge       - Asks for confirmation before purging
 *   bun run purge:force - Purges immediately without prompt
 *
 * Run outside container:
 *   docker exec server bun run purge
 *   docker exec server bun run purge:force
 */

import 'dotenv/config';
import mongoose from 'mongoose';
import readline from 'readline';

// Models
import User from '../src/shared/models/user.model.js';
import Property from '../src/shared/models/property.model.js';
import Unit from '../src/shared/models/unit.model.js';
import TenantProfile from '../src/shared/models/tenantProfile.model.js';
import Lease from '../src/shared/models/lease.model.js';
import Payment from '../src/shared/models/payment.model.js';
import Ticket from '../src/shared/models/ticket.model.js';
import Announcement from '../src/shared/models/announcements.model.js';
import AuditLog from '../src/shared/models/auditLog.model.js';
import Document from '../src/shared/models/document.model.js';

// ─── Helpers ────────────────────────────────────────────────────────────────

const log = {
  info:    (m) => console.log(`  \x1b[36mℹ\x1b[0m  ${m}`),
  success: (m) => console.log(`  \x1b[32m✔\x1b[0m  ${m}`),
  error:   (m) => console.log(`  \x1b[31m✘\x1b[0m  ${m}`),
  warn:    (m) => console.log(`  \x1b[33m⚠\x1b[0m  ${m}`),
  section: (m) => console.log(`\n\x1b[1m\x1b[35m▸ ${m}\x1b[0m`),
  done:    (m) => console.log(`\n\x1b[1m\x1b[32m✔ ${m}\x1b[0m\n`),
};

function confirm(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim().toLowerCase());
    });
  });
}

// ─── Connect ─────────────────────────────────────────────────────────────────

const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) {
  log.error('MONGO_URI is not set in .env');
  process.exit(1);
}

console.log('\n\x1b[1m\x1b[31m══════════════════════════════════════\x1b[0m');
console.log('\x1b[1m\x1b[31m  JPTL Database Purge\x1b[0m');
console.log('\x1b[1m\x1b[31m══════════════════════════════════════\x1b[0m\n');

// ─── Confirmation Guard ───────────────────────────────────────────────────────

const FORCE = process.argv.includes('--force') || process.env.PURGE_FORCE === '1';

if (!FORCE) {
  log.warn('This will permanently delete ALL data from every collection.');
  log.warn('This action is IRREVERSIBLE.');
  const answer = await confirm('\n  Type "yes" to confirm: ');
  if (answer !== 'yes') {
    log.info('Purge aborted — no data was deleted.');
    process.exit(0);
  }
}

log.info('Connecting to MongoDB…');
await mongoose.connect(MONGO_URI);
log.success('Connected.\n');

// ─── Collections to Purge (order matters for clarity, no FK cascade needed in Mongo) ──

const collections = [
  { name: 'AuditLogs',      model: AuditLog },
  { name: 'Documents',      model: Document },
  { name: 'Payments',       model: Payment },
  { name: 'Tickets',        model: Ticket },
  { name: 'Announcements',  model: Announcement },
  { name: 'Leases',         model: Lease },
  { name: 'TenantProfiles', model: TenantProfile },
  { name: 'Units',          model: Unit },
  { name: 'Properties',     model: Property },
  { name: 'Users',          model: User },
];

log.section('Purging Collections');

let totalDeleted = 0;

for (const col of collections) {
  try {
    const result = await col.model.deleteMany({});
    const n = result.deletedCount;
    totalDeleted += n;
    log.success(`${col.name.padEnd(16)} — ${n} document${n !== 1 ? 's' : ''} deleted`);
  } catch (err) {
    log.error(`${col.name.padEnd(16)} — FAILED: ${err.message}`);
  }
}

await mongoose.disconnect();

log.done(`Purge complete — ${totalDeleted} total documents removed. Database is now empty.`);
