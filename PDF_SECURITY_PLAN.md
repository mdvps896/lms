# Secure Direct-PDF Plan (no chunks)

**Goal (from requirement):**

1. **No chunks anywhere.** A PDF is uploaded and stored as ONE normal `.pdf` file on disk. No `manifest.json` + `chunk_00000.bin` directories for new uploads. Direct `.pdf` reading.
2. **A PDF must never open from a normal URL.** Hitting the file path directly (no token) → does not open (404/401).
3. **Token-gated.** The serving link must carry a **signed, short-lived token**. Without a valid token → no access.
4. **Token is verified on every request**, not once. Expiry is enforced every time.
5. **Tamper-proof.** The token is a signed JWT that binds `userId` + exact file `path` + access `scope`. Changing the path, the user, or flipping any `yes/no` value in the request cannot grant access — the server re-derives authorization live from the DB (enrollment / free-material / admin / login) on every hit.
6. Works for **web** and **mobile app**. Free material PDFs also require login **and** a token.

---

## Design

### Token (`utils/pdfAccessToken.js`)
- `createPdfAccessToken({ userId, filePath, scope })` → JWT signed with `JWT_SECRET` (reuse `jose`, same secret as auth). TTL **5 minutes**. `typ: 'pdf-access'`.
- Payload: `{ typ:'pdf-access', uid, p: <normalized filePath>, scope, iat, exp }`.
- `verifyPdfAccessToken(token)` → returns payload or null (null on bad signature **or** expiry — mirror `verifyToken`).
- `scope` values: `admin`, `free-material`, `course:<courseId>`.

### Issue endpoint — `POST /api/storage/pdf-token`
- Auth required (Bearer or cookie, via `getAuthenticatedUser`). Not in `publicApiRoutes`.
- Body: `{ path, courseId?, lectureId?, materialId? }`.
- Server normalizes `path` (strip leading `/`, must start `uploads/`, must end `.pdf`, no `..`).
- Authorization decision (live):
  - `admin` role → scope `admin`.
  - `courseId` present → `checkEnrollment(user, courseId)`; also allow if the lecture is `isDemo` or course `isFree` (load course, find lecture by `lectureId`, confirm `lecture.content` resolves to this `path`). scope `course:<courseId>`.
  - `materialId` present (free material) → user just needs to be logged in; load `FreeMaterial`, confirm one of its `files[].url` resolves to this `path`. scope `free-material`.
- On allow → `{ success:true, token, expiresIn:300 }`. Else 403.

### Serve endpoint — `GET /api/storage/secure-file?path=...&token=...`
- **PDF branch**: require `token`. `verifyPdfAccessToken`; then:
  - `payload.p` must **exactly equal** the normalized `path` query param → else 403.
  - Re-run the same live authorization as the issue endpoint using `payload.uid` + `payload.scope` (re-load user, re-check enrollment / free-material / admin). Any "no" → 403. This is the every-request re-check.
  - Stream the single `.pdf` file (Range supported) with `Cache-Control: no-store`, `Content-Disposition: inline`, `X-Content-Type-Options: nosniff`.
  - Legacy: if the on-disk path is still a chunk directory, reconstruct via existing `createChunkedReadStream` (read-only back-compat only).
- **Non-PDF branch**: unchanged (existing Bearer/cookie behavior).
- Middleware: `/api/storage/secure-file` stays **not public** (still needs a session) — but mobile pdf viewer / iframe cannot always send Bearer, so the PDF branch treats a valid `token` as sufficient credential. Add `secure-file` handling so a request with `?token=` but no session is still allowed to reach the route (either whitelist `secure-file` in middleware and let the route enforce, or accept `token` query in middleware). Decision: **whitelist `/api/storage/secure-file` in middleware `publicApiRoutes` and enforce entirely in the route** (route already calls `getAuthenticatedUser`; PDF branch requires token, non-PDF branch requires user).

### Remove chunk-writing
- `utils/localStorage/save.js`: always `fs.writeFile` single file. Delete the `CHUNK_THRESHOLD_BYTES` branch + `writeChunked` import.
- `utils/localFileStorage.js`: same.
- Keep `chunkedStorage.js` read helpers (`readManifest`, `createChunkedReadStream`) for legacy on-disk data; delete `writeChunked` or leave unused. Keep client-transfer helpers (`saveUploadSlice`/`assembleUploadSession`) — those assemble to ONE file and never leave chunks on disk; the browser still needs them to beat the request body limit. (Confirm with user if they want those gone too.)
- `/api/storage/file/[...path]` and `/api/storage/files`: leave chunk *reading* for back-compat.

### Consumers
- **Web admin viewer** (`AdminPdfViewerModal` via `CourseViewModal`, `FreeMaterialList`): switch from `/api/admin/materials/pdf?path=` to: call `/api/storage/pdf-token` then fetch `/api/storage/secure-file?path=&token=`. (Or keep `/api/admin/materials/pdf` for admin — it is already admin-live-checked. Lower priority; do it for consistency.)
- **Mobile `pdf_viewer_screen.dart`**: in `_loadPdf`, before download, POST `/api/storage/pdf-token` (with courseId/lectureId or materialId), then GET `secure-file?path=&token=`. On 401/expired during re-download, re-request token.
- **Mobile `documents_tab.dart` `_downloadFile`**: same token step.
- **Mobile `api_service.dart`**: add `getPdfAccessToken({path, courseId, lectureId, materialId})`.
- **`free-materials` API**: include `materialId` (already `material._id`) so the app can request a token. PDF `file.url` stays `/api/storage/file/uploads/...` as the identifier; app converts to `secure-file`.

### Cleanup / hardening
- `/api/admin/materials/pdf`: keep as admin-only fallback OR delete after web viewer migrates.
- Existing chunked PDFs in `public/uploads/documents/images/*.pdf/` — optional migration script to flatten to single files. Not required (legacy read still works).

---

## Tasks (do 1 by 1, tick when done)

- [x] **T1** — `utils/pdfAccessToken.js`: `createPdfAccessToken` / `verifyPdfAccessToken` + `normalizePdfPath`. Token payload binds `uid`, exact `p`, `scope`, `ctx`. 5-min TTL, HS256 w/ `JWT_SECRET`.
- [x] **T2** — `POST /api/storage/pdf-token` + shared `utils/pdfAuthorization.js` `authorizePdfAccess()` (admin/teacher · course: lecture-must-match + free/demo/enrolled · free-material: match + logged-in).
- [x] **T3** — Reworked `GET /api/storage/secure-file`: PDF branch = token required → exact-path bind → fresh `User` load (suspended/inactive blocked) → live `authorizePdfAccess` re-check every hit → stream single file / legacy chunk dir. All failures return 404. Non-PDF branch unchanged.
- [x] **T4** — `middleware.js`: `/api/storage/secure-file` added to `publicApiRoutes` (route self-enforces). `/api/storage/pdf-token` stays behind middleware JWT.
- [x] **T5** — `utils/localStorage/save.js` + `utils/localFileStorage.js`: always `writeFile` a single file, `writeChunked`/`CHUNK_THRESHOLD_BYTES` imports removed. Chunk *read* helpers kept for legacy on-disk data.
- [x] **T6** — `AdminPdfViewerModal` now takes `filePath` + `courseId/lectureId/materialId`, fetches a token via `/api/storage/pdf-token`, loads `secure-file?path=&token=`. `CourseViewModal` + `FreeMaterialList` updated (dropped `/api/admin/materials/pdf` usage).
- [x] **T7** — Mobile `api_service.dart`: `getPdfAccessToken({path, courseId, lectureId, materialId})`.
- [x] **T8** — Mobile `pdf_viewer_screen.dart` `_loadPdf`: stable `cacheKey` (path, not tokenized URL) + token fetch + `&token=` on secure-file URL; no token → error state.
- [x] **T9** — Mobile `documents_tab.dart` `_downloadFile`: token fetch (materialId) + `&token=`; no token → throws.
- [x] **T10** — No change: `materialId` = `material._id`, already returned by `free-materials` GET and already used by both clients.
- [x] **T11** — Keep `/api/admin/materials/pdf` as admin-only, live-checked fallback (no code references it now; harmless).
- [ ] **T12** — Manual test matrix: web admin view; app enrolled course PDF; app non-enrolled (blocked); app free material (logged in ok / no token blocked); direct URL without token (blocked); expired token (blocked); token for file A used on file B (blocked); DB un-enroll mid-session (next request blocked). **← user to run**
- [ ] **T13** — (optional) flatten existing on-disk chunked PDFs in `public/uploads/documents/images/*.pdf/`. Not required — legacy read still works.

## Known follow-ups / notes
- Non-PDF `secure-file` requests no longer get the middleware's transparent expired-token refresh (route now public, uses `getAuthenticatedUser` which rejects expired). Impact: admin selfie-image proxy may 401 on a stale access token until the app refreshes. Low risk; revisit if it bites.
- Client-side *transfer* chunking (`FileUpload.jsx` → `/api/storage/chunked-upload` → `assembleUploadSession`) is kept: it reassembles to ONE file server-side and never leaves chunks on disk. Tell me if you want it gone too (would cap uploads at the Next body limit).

---

## Round 2 — full chunk removal + selfie lockdown + Flutter env

- [x] **C1** — Ran `scripts/flatten-chunked-storage.js --apply`: every `public/**/*.{pdf,mp4}/` chunk directory reconstructed into a single file. 0 chunk dirs / 0 `chunk_*.bin` left (only the PWA `public/manifest.json` remains).
- [x] **C2** — Deleted `src/utils/chunkedStorage.js` and `src/app/api/storage/chunked-upload/`.
- [x] **C3** — Removed every chunk import + directory-reconstruct branch from: `secure-file`, `storage/file/[...path]`, `storage/files`, `admin/materials/pdf`, `localStorage/save.js`, `localStorage/delete.js`, `localFileStorage.js`. Directories now just 404 / recurse.
- [x] **C4** — `FileUpload.jsx`: removed `uploadLargeFile` (client chunk splitter) + `/api/storage/chunked-upload` call. `>20MB` → raw binary body to `/api/storage/binary-upload` (fallback `simple-upload`); smaller → `/api/storage/upload`. Removed all `isChunked` UI in `FileUpload`, `UploadProgress`, `FileCard`, `FileListItem`.
- [x] **C5** — `.gitignore`: dropped `.tmp-chunk-uploads/`. `next.config.mjs` comment updated. `scripts/flatten-chunked-storage.js` kept (one-time tool for other environments).

- [x] **S1** — Selfies + face-verification images can no longer be opened by direct URL:
  - `/api/storage/file/[...path]` now 404s any path under `uploads/selfies/`, `selfies/`, or `verification/` (same treatment PDFs already had).
  - `next.config.mjs` `rewrites().beforeFiles`: `/verification/:path*` → `/api/storage/secure-file?path=/verification/:path*` (runs before static `public/` serving, so the raw files are no longer statically reachable).
  - `secure-file` non-PDF branch: selfie/verification media is admin **or owner only** (path must contain the caller's userId), never treated as a public asset.

- [x] **E1** — Flutter: removed `flutter_dotenv`, `assets/.env`, root `.env`, the pubspec asset entry, and `dotenv.load()` in `main.dart`. New `lib/config/env.dart` with compile-time `String.fromEnvironment` / `bool.fromEnvironment` (`API_URL`, `ENABLE_MOBILE_OTP`) — production defaults baked in; override with `--dart-define` / `--dart-define-from-file=env.json`. All call sites (`base_api_service`, `login_screen`, `pdf_viewer_screen`, `documents_tab`, `lecture_player_screen`, `course_video_player`, `esign_form_widgets`) switched to `Env.*`. `AppConstants.defaultApiUrl` kept as a deprecated alias → `Env.apiUrl`. `env.example.json` added; `env.json` git-ignored. `flutter analyze` on touched files: 0 errors. `flutter pub get`: OK.

## Progress log

- 2026-09-01: Plan created. Codebase reviewed.
- 2026-09-01: T1–T11 implemented (see checklist). New files: `src/utils/pdfAccessToken.js`, `src/utils/pdfAuthorization.js`, `src/app/api/storage/pdf-token/route.js`. Changed: `secure-file/route.js`, `middleware.js`, `localStorage/save.js`, `localFileStorage.js`, `AdminPdfViewerModal.jsx`, `CourseViewModal.jsx`, `FreeMaterialList.jsx`, mobile `api_service.dart`, `pdf_viewer_screen.dart`, `documents_tab.dart`. Remaining: T12 (manual test), T13 (optional legacy flatten).
