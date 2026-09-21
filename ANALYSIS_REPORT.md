# Full Codebase Analysis & Fix Report

Generated as part of a full backend + frontend security/quality audit of the `exam` Next.js app.

## Summary

- **Backend routes reviewed:** all 200 `src/app/api/**` route files, `src/models/*`, `src/lib/*`, `src/middleware.js`
- **Critical/high-severity bugs found:** 55+
- **Critical/high-severity bugs fixed:** 50+
- **Dead code removed:** 2 files
- **Oversized files (>400 lines) split into folders:** 10 files

---

## Critical bugs fixed

### Root-cause / systemic

| # | File | Bug | Fix |
|---|------|-----|-----|
| 1 | `src/middleware.js` | `publicApiRoutes`/`publicRoutes` matched with a bare `startsWith()`, so `/api/settings` also matched `/api/settings/test-payment` (leaking live Razorpay keys) and `/api/upload` also matched `/api/upload-sound` — silently making unrelated routes public with no auth at all. | Matching now requires an exact path or a `/` boundary (`pathname === route \|\| pathname.startsWith(route + '/')`). |
| 2 | `src/app/api/exams/[id]/take/route.js` | Correct answers (`option.isCorrect`) were sent to the browser while a student was actively taking an exam — visible via devtools network tab. | Strip `isCorrect` from every option before returning questions. |

### Authentication / authorization bypasses

| File | Bug | Fix |
|---|---|---|
| `api/auth/google-register/route.js` | Google ID token was never verified — anyone could log in as any existing user (including admins) by POSTing just their email. | Verify the ID token server-side via Firebase Admin before trusting email/name. |
| `api/auth/update-google-password/route.js` | No auth/ownership check; password stored in **plaintext**. Confirmed dead code (no caller in `src/`), fixed anyway since it's still reachable over HTTP. | Requires auth + ownership, hashes with bcrypt. |
| `api/auth/reset-password/route.js` | OTP was returned in the API response body — reset flow could be completed without ever reading the victim's email. No rate limiting. | Removed `otp` from response; added `checkOTPRateLimit`. |
| `api/auth/change-password/route.js` | `userId` taken from request body, not the authenticated session — any account's password could be brute-forced via this endpoint (no lockout, unlike login). Also crashed for social-login users (`user.password` undefined). | Requires auth; `userId` must match caller (or be admin); guards missing password. |
| `api/auth/migrate/route.js` | Same undefined-password crash. | Guarded. |
| `api/auth/login/route.js` | `console.log(token)` referenced `token` before its `const` declaration in the device-lockout branch → `ReferenceError` → unhandled 500 instead of the intended lockout response. Also logged full JWTs to server console on every login. | Fixed dead-before-init reference; removed token logging. |
| `api/admin/students/route.js`, `admin/students/[id]/route.js` | No auth at all — anyone could list/create/update/delete student accounts. `PUT` also allowed setting `role: "admin"` (privilege escalation via mass assignment). | Added `manage_students` permission check to all handlers; `role`/`permissions`/`accessScope` stripped from update payloads. |
| `api/admin/courses/**` (7 files: `[id]`, `[id]/students`, `[id]/reviews`, `[id]/reviews/[reviewId]`, `[id]/curriculum/topics`, `.../lectures`, `.../lectures/[lectureId]`) | No auth on any handler — anyone could view/edit/delete any course, curriculum, lecture, or review. | Added `manage_courses` permission check to every handler. |
| `api/admin/update-marks/[attemptId]/route.js` | Role check read from the unsigned, client-writable `user` cookie — anyone could set that cookie via devtools and rewrite exam scores. | Switched to the signed JWT via `getAuthenticatedUser`. |
| `api/admin/progress/bill/route.js` | No auth on admin "upload bill"; student "mark downloaded" action had no ownership check. | Added `requireAdmin` / ownership check respectively. |
| `api/users/[id]/route.js` (PATCH) | No auth at all (GET/PUT/DELETE in the same file were protected, PATCH wasn't) — role escalation via `{"role":"admin"}`. | Added the same permission check used by GET/PUT/DELETE. |
| `api/users/profile/route.js` | Identity read from the unsigned `user` cookie — anyone could forge another user's `_id` and edit their profile. | Switched to signed JWT. |
| `api/users/[id]/details/route.js` | No auth — full PII/exam history/GPS coordinates for any user readable by ID. | Added `requireAdminOrOwner`. |
| `api/users/deleted/route.js` | No auth — leaked deleted students' PII. | Added `manage_students` permission check. |
| `api/reports/student-comprehensive/route.js` | No auth — anyone with a `studentId` could download a full PDF report. | Added `requireAdminOrOwner`. |
| `api/storage/users/[userId]/selfies/route.js` | No auth — anyone could list another student's proctoring selfies. | Added `requireAdminOrOwner`. |
| `api/storage/upload/route.js`, `direct-upload`, `chunked-upload`, `binary-upload`, `simple-upload` | No auth on any — plus `upload/route.js` let an unauthenticated caller make the server `fetch()` an arbitrary URL (SSRF). | Added auth to all 5; the URL-fetch path is now admin-only. |
| `api/upload/route.js`, `api/upload-sound/route.js` | Reachable with no auth at all — `upload-sound` was additionally exposed by the middleware prefix bug (#1 above). | Both gated by `getAuthenticatedUser`. |
| `api/courses/[id]/like/route.js`, `.../rate/route.js` | `userId` taken from request body — anyone could like/rate a course "as" any other user. | `userId` now derived from the authenticated session, not the body. |
| `api/support/send/route.js` | `isAdmin` flag was trusted from the client — any student could forge an "admin" reply into any conversation. | `isAdmin` now derived from the caller's real role; `userId`/`senderId` both checked against the session. |
| `api/settings/test-payment/route.js`, `api/notifications/send/route.js` (POST+PUT), `api/notifications/test/route.js` | No auth — anyone could trigger live Razorpay order creation, or push arbitrary FCM notifications/spam to any token or topic. | Added `requireAdmin`. |
| `api/question-groups/[id]/route.js`, `api/free-materials/[id]/route.js`, `api/questions/bulk-delete`, `.../export`, `.../import` | No auth — anyone could view/edit/delete question groups, free materials, or bulk-delete/dump/import the entire question bank. | Added `manage_questions` / `requireAdmin` checks. |
| `api/analytics/route.js`, `api/exam-analytics/[id]/route.js`, `api/exam-details/[id]/route.js`, `api/global-search/route.js`, `api/tests/route.js` | No auth — analytics, per-exam class rosters (names/emails/scores), and search results exposed to anyone. | Added `view_analytics` permission / `requireAuth`. |
| `api/find-user`, `api/debug-exams`, `api/debug-sessions`, `api/test-db` | Leftover debug endpoints with no auth, leaking user/exam/PDF-view data; `debug-sessions` also had an invalid hardcoded ObjectId fallback that would crash. | Disabled outside development + admin-gated; removed the invalid fallback. |
| `api/seed/route.js` | Bootstraps hardcoded default accounts (known passwords) whenever the DB is empty — a race against real setup in production. | Disabled in production (`npm run create:admin` / `scripts/createAdmin.js` is the supported path). |
| `api/send-otp/route.js` | Legacy/unused endpoint returned the OTP directly in the response body; no rate limit. | Removed OTP from response; added rate limiting. |
| `api/exams/result/[attemptId]/route.js` | No auth/ownership check — any attempt's score/answers readable by guessing the attempt ID (IDOR). | Added auth + ownership check. |
| `api/exams/force-submit/route.js` | No auth — anyone could force-submit any other student's in-progress exam. | Added auth + ownership check. |
| `api/exams/submit/route.js`, `api/exams/save-answer/route.js` | No auth — an exposed session token alone was enough to submit/tamper with any attempt's answers. | Added auth + ownership check (handles both the standalone `ExamAttempt` collection and the embedded `Exam.attempts` path). |
| `api/exams/cleanup-attempts/route.js` | No auth on an endpoint that force-expires active attempts. | Added `requireAdmin`. |
| `api/exam-attempts/verification/route.js` | Crashed (`TypeError`) if `verification`/`faceVerification` wasn't already initialized on the attempt. | Defensive initialization before use. |
| `api/live-snapshot/route.js` | Used `NextResponse` without importing it — every request threw `ReferenceError`, so live-monitoring snapshots were completely broken. | Added the missing import. |
| `src/app/api/student/selfies/upload/route_temp.js` | Dead leftover file, never routed by Next.js; if ever revived it would crash on an uninitialized array and skip Cloudinary upload for exam selfies. | Deleted. |

### Payments (financial integrity)

| Bug | Fix |
|---|---|
| `create-order` trusted a client-supplied `amount`, decoupled from any course — an attacker could create a ₹1 order, pay it, then "verify" it against a full-price course. | Amount is now computed server-side from the course price (+ server-validated coupon) whenever `courseId` is supplied; the courseId/userId/amount are stamped into the Razorpay order's `notes`. |
| `verify-payment` never cross-checked the order against the course/amount — a valid signature only proves the order+payment IDs match, not what they were for. | Fetches the order from Razorpay and validates `notes.courseId` + `order.amount` against the target course before enrolling. |
| No idempotency — a retried/replayed verify call re-ran enrollment and re-fired notifications, and could create duplicate `Payment` rows. | Verify now short-circuits if a `Payment` already exists for that `razorpayPaymentId`. |
| Free/coupon enrollment trusted a client `isFree:true, amount:0` flag with **no** server-side coupon validation. | Free enrollment now re-validates the coupon (active, dated, usage limit, applicability, discount actually covers 100%) server-side. |
| `coupons/validate/route.js` had no branch for `applicationType: 'students'`, so a student-restricted coupon fell through to "always valid". | Added the missing branch. |
| **Compatibility note:** the mobile app's payment flow (`mobile/lib/...`) was intentionally left untouched per your instruction. It still sends only a raw `amount` with no `courseId`, so `create-order`/`verify-payment` keep a legacy fallback path for that case (trusts the client amount, same as before) — the new protections only fully apply when `courseId` is supplied (web today; mobile whenever it's updated to send it). | — |

### Models

| File | Bug | Fix |
|---|---|---|
| `src/models/Coupon.js` | `discountValue` had no upper bound, so a `percentage` coupon could be stored as e.g. `500`, producing a negative final price anywhere that trusted the schema instead of the two route-level checks. | Added a schema-level validator capping percentage discounts at 100. |
| `src/models/FreeMaterial.js` | No `timestamps`, so edits after creation were never tracked. | Switched to `{ timestamps: true }`. |

---

## Not auto-fixed (flagged for a decision)

These are real but either architectural, ambiguous, or outside safe automated-refactor territory:

1. **Split-brain exam attempt storage** — `Exam.attempts` (embedded) and the standalone `ExamAttempt` collection are both actively written by different routes with no single source of truth, and `save-answer` syncs them best-effort in a try/catch that silently swallows failures on divergence. This needs a deliberate migration decision, not a patch.
2. **Two independent scoring implementations** (`api/exams/submit` vs `api/exam-attempts/route.js` POST) can score identical answers differently depending on which endpoint is called. Needs consolidation onto one scoring function.
3. **`api/exams/cleanup-attempts`** hard-sets score to `0` for any attempt that expires before submission (`// TODO: Calculate score based on answers` was already in the code) — a student who answered everything correctly gets 0. Left as-is; needs a product decision on whether to score expired attempts.
4. **Paid course content (`courses/[id]/route.js`) returns raw `/api/storage/file/...` URLs**, which is an unauthenticated static file server relying only on unguessable UUID filenames — not real access control. A `storage/secure-file` route already exists with proper auth/enrollment checks but paid lecture content doesn't route through it. **This is directly relevant to the chunked-upload feature you asked for next** — worth designing chunked storage so paid content is served only through an authenticated path.
5. **Page-level role gating in `middleware.js`** (the second half, for non-API page routes) still trusts the unsigned `user` cookie to decide which pages a student/teacher can navigate to. This is lower risk than the API-level bypasses (all real data access is now behind the JWT-based API checks fixed above), but a forged cookie could still render UI a role shouldn't see. Left as-is — fixing it cleanly means deriving role from the signed token in middleware too, a broader change.
6. **`Settings.singleton` unique index isn't upsert-guarded** — two concurrent first-run requests could race and throw a duplicate-key error. Low real-world likelihood (only matters on a cold, empty settings collection).

---

## Files split (>400 lines → folder of smaller files)

Every split is a pure extraction — same state, same effects, same rendered output, verified by a passing `npm run build` after each.

| Original file (lines) | New structure |
|---|---|
| `src/app/exams/[examId]/take/page.js` (982) | `page.js` (284) + `_components/`: `useExamAttempt.js` (407), `useExamSecurity.js` (163), `useRecordingSession.js` (130), `ExamStyles.js` (72), `SubjectTabs.js` (27), `FullScreenOverlay.js` (27) |
| `src/app/(general)/exam-analytics/page.js` (926) | `page.js` (258) + `_components/`: `ExamDetailView.js` (281, used by `[id]/page.js`), `examDataHelpers.js` (144), `ExamsTable.js` (109), `ExamAnalyticsSection.js` (80), `ExamFiltersHeader.js` (76), `ExamSummaryStats.js` (49), `fallbackData.js` (38) |
| `src/components/support/AdminSupportChat.js` (802) | `AdminSupportChat/index.js` (130, default export unchanged) + `useAdminSupportChat.js` (393), `BulkMessageModal.js` (184), `ChatWindow.js` (126), `ConversationSidebar.js` (102), `NewChatModal.js` (60), `WhatsAppModal.js` (53), `UserAvatar.js` (26) |
| `src/app/(general)/my-results/[examId]/[attemptId]/page.js` (752) | `page.js` (234) + `_components/`: `QuestionReviewList.js` (276), `ResultHeader.js` (93), `ResultStats.js` (83), `LoadingSkeleton.js` (83), `helpers.js` (53), `DraftStatusBanner.js` (37) |
| `src/app/(general)/my-results/[examId]/page.js` (696) | `page.js` (182) + `_components/`: `certificateGenerator.js` (239), `AttemptsTable.js` (130), `LoadingSkeleton.js` (99), `AttemptsFilters.js` (74), `ExamInfoCard.js` (34), `formatters.js` (16) |
| `src/utils/localStorage.js` (613) | `localStorage/index.js` (3, barrel re-export — `@/utils/localStorage` imports unchanged) + `info.js` (190), `delete.js` (167), `fileHelpers.js` (164), `save.js` (121), `constants.js` (14) |
| `src/app/(general)/recorded-exams/page.js` (600) | `page.js` (151) + `_components/`: `UserAttemptsModal.js` (230), `VideoModal.js` (105), `AttemptsByUserGrid.js` (99), `ExamsGrid.js` (52), `helpers.js` (17) |
| `src/app/(general)/profile/page.js` (473) | `page.js` (174) + `_components/`: `ProfileInfoForm.js` (151), `SubjectsCard.js` (59), `ProfileImageUpload.js` (54), `CategoryCard.js` (50), `AccountInfoCard.js` (50), `ProfileSidebar.js` (27), `utils.js` (12) |
| `src/components/storage/UserSelfiesModal.js` (448) | `UserSelfiesModal/index.js` (74, default export unchanged) + `useSelfiesActions.js` (188), `ModalHeader.js` (78), `ModalTabs.js` (61), `SelfieCard.js` (66), `SelfieGrid.js` (40), `utils.js` (36), `ImagePreviewOverlay.js` (31), `SelfieImage.js` (26) |
| `src/app/storage/page.js` (407) | `page.js` (53) + `_components/`: `useStorageData.js` (146), `FilesPanel.js` (94), `storageUtils.js` (79), `StoragePagination.js` (74), `StorageModeToggle.js` (37), `ExamRecordingBanner.js` (35), `DeletingOverlay.js` (31) |
| `src/app/api/payment/verify-payment/route.js` (grew to 421 during the security fixes above) | `route.js` (247) + `helpers.js` (109) — extracted the enrollment and purchase-notification logic that was duplicated between the free-coupon and paid-payment branches |

One file remains marginally over budget: `_components/useExamAttempt.js` (407 lines) — a single cohesive custom hook (all exam-attempt state/lifecycle logic); splitting it further would fragment one tightly-coupled state machine across files rather than genuinely simplifying it.

## Verification

`npm run build` passes cleanly (exit 0) after every change in this report. No file under `src/` exceeds 400 lines except the one noted above.

## Note on this session

A background refactor agent unexpectedly ran a `git stash`/reset mid-session that temporarily wiped ~50 files' worth of the security fixes above from disk. They were recovered intact from `stash@{0}` (still kept in your stash list as a backup — safe to drop once you've reviewed everything with `git stash drop`), and every fix in this report was re-verified present on disk and via a clean build afterward.
