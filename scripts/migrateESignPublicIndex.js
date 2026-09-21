// One-time migration: fix the ESignSubmission `user` index so public (no
// account) e-sign submissions can coexist.
//
// The old schema had `user: { required: true, unique: true }`, which created
// a plain unique index — MongoDB treats every document's missing/null value
// as needing uniqueness too, so a SECOND public submission (which has no
// `user` at all) fails with a duplicate-key error against the FIRST one.
// The new schema uses a SPARSE unique index instead (only enforces
// uniqueness among documents that actually have a `user`), but Mongoose
// does not alter an already-existing index with the same name/keys — it has
// to be dropped and recreated once, here, against the real database.
//
// Usage: node scripts/migrateESignPublicIndex.js
const fs = require('fs');
const path = require('path');

function loadEnvLocal() {
  const envPath = path.join(__dirname, '..', '.env.local');
  if (!fs.existsSync(envPath)) return;
  const content = fs.readFileSync(envPath, 'utf-8');
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const idx = trimmed.indexOf('=');
    if (idx === -1) continue;
    const key = trimmed.slice(0, idx).trim();
    let value = trimmed.slice(idx + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = value;
  }
}

loadEnvLocal();

const mongoose = require('mongoose');

async function main() {
  const MONGODB_URI = process.env.MONGODB_URI;
  if (!MONGODB_URI) {
    console.error('MONGODB_URI not defined in .env.local');
    process.exit(1);
  }

  await mongoose.connect(MONGODB_URI);
  console.log('✅ MongoDB connected');

  const coll = mongoose.connection.db.collection('esignsubmissions');
  const indexes = await coll.indexes();

  const oldIndex = indexes.find((i) => i.name === 'user_1' && !i.sparse);
  if (oldIndex) {
    await coll.dropIndex('user_1');
    console.log('🗑️  Dropped old non-sparse unique index on `user`');
  } else {
    console.log('ℹ️  No old non-sparse `user` index found (already migrated, or collection is empty/new)');
  }

  await coll.createIndex({ user: 1 }, { unique: true, sparse: true });
  await coll.createIndex({ source: 1, createdAt: -1 });
  console.log('✅ Correct indexes ensured');

  await mongoose.disconnect();
  console.log('✅ Done');
}

main().catch((err) => {
  console.error('❌ Migration failed:', err);
  process.exit(1);
});
