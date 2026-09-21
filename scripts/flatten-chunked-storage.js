/**
 * ONE-TIME migration for existing servers: the app no longer stores anything as
 * chunk directories. This walks public/ and replaces every
 * `<name>/{manifest.json, chunk_*.bin}` directory with a single reconstructed
 * file at `<name>`. Safe to delete this script once every environment has run it.
 *
 *   node scripts/flatten-chunked-storage.js          # dry run
 *   node scripts/flatten-chunked-storage.js --apply  # do it
 */
const fs = require('fs');
const path = require('path');

const APPLY = process.argv.includes('--apply');
const ROOT = path.join(process.cwd(), 'public');

function walk(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        if (!entry.isDirectory()) continue;
        const full = path.join(dir, entry.name);
        const manifestPath = path.join(full, 'manifest.json');
        if (fs.existsSync(manifestPath)) flatten(full, manifestPath);
        else walk(full);
    }
}

function flatten(dirPath, manifestPath) {
    let manifest;
    try {
        manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
    } catch {
        console.warn(`SKIP (bad manifest): ${dirPath}`);
        return;
    }
    const count = manifest.chunkCount ?? 0;
    const parts = [];
    for (let i = 0; i < count; i++) {
        const p = path.join(dirPath, `chunk_${String(i).padStart(6, '0')}.bin`);
        if (!fs.existsSync(p)) {
            console.warn(`SKIP (missing chunk ${i}): ${dirPath}`);
            return;
        }
        parts.push(p);
    }
    const buf = Buffer.concat(parts.map((p) => fs.readFileSync(p)));
    console.log(`${APPLY ? 'FLATTEN' : 'would flatten'}: ${dirPath}  (${count} chunks, ${buf.length} bytes)`);
    if (!APPLY) return;
    const tmp = `${dirPath}.__tmp`;
    fs.writeFileSync(tmp, buf);
    fs.rmSync(dirPath, { recursive: true, force: true });
    fs.renameSync(tmp, dirPath);
}

walk(ROOT);
console.log(APPLY ? 'Done.' : 'Dry run complete. Re-run with --apply to make changes.');
