import { normalizePdfPath } from './pdfAccessToken';
import { checkEnrollment } from './courseAccess';

/**
 * Single source of truth for "is this user allowed to read this PDF right now".
 *
 * Called BOTH when a token is issued (`/api/storage/pdf-token`) and again on
 * EVERY serve request (`/api/storage/secure-file`) — so revoking an enrollment,
 * deleting a material, or expiring course access takes effect on the very next
 * request, and a token can never outlive the access it represents.
 *
 * @param {object} args
 * @param {{id?:string,_id?:string,role?:string}|null} args.user  authenticated user (JWT payload shape)
 * @param {string} args.filePath  requested file path/url (any form; normalized here)
 * @param {string} [args.courseId]
 * @param {string} [args.lectureId]
 * @param {string} [args.materialId]
 * @returns {Promise<{ allowed: boolean, scope: string|null, reason?: string }>}
 */
export async function authorizePdfAccess({ user, filePath, courseId, lectureId, materialId }) {
    const p = normalizePdfPath(filePath);
    if (!p) return { allowed: false, scope: null, reason: 'bad-path' };
    if (!user) return { allowed: false, scope: null, reason: 'no-user' };

    // Admin / teacher: full access to any uploads PDF.
    if (user.role === 'admin' || user.role === 'teacher') {
        return { allowed: true, scope: 'admin' };
    }

    // ---- Course lecture PDF -------------------------------------------------
    if (courseId) {
        const { default: Course } = await import('@/models/Course');
        const course = await Course.findById(courseId).select('isFree curriculum').lean();
        if (!course) return { allowed: false, scope: null, reason: 'course-not-found' };

        // The file must actually belong to a lecture in this course (pdf or
        // locally-hosted video — YouTube/external video lectures never reach
        // this token-gated path since they aren't uploads/ paths).
        let lecture = null;
        for (const topic of course.curriculum || []) {
            for (const lec of topic.lectures || []) {
                if (lec.type !== 'pdf' && lec.type !== 'video') continue;
                if (normalizePdfPath(lec.content) !== p) continue;
                if (!lectureId || String(lec._id) === String(lectureId)) {
                    lecture = lec;
                    break;
                }
            }
            if (lecture) break;
        }
        if (!lecture) return { allowed: false, scope: null, reason: 'lecture-mismatch' };

        if (course.isFree || lecture.isDemo) {
            return { allowed: true, scope: `course:${courseId}` };
        }

        const { enrolled } = await checkEnrollment(user, courseId);
        if (enrolled) return { allowed: true, scope: `course:${courseId}` };

        return { allowed: false, scope: null, reason: 'not-enrolled' };
    }

    // ---- Free material PDF ------------------------------------------------------
    if (materialId) {
        const { default: FreeMaterial } = await import('@/models/FreeMaterial');
        const material = await FreeMaterial.findById(materialId).select('files').lean();
        if (!material) return { allowed: false, scope: null, reason: 'material-not-found' };

        const belongs = (material.files || []).some((f) => normalizePdfPath(f.url) === p);
        if (!belongs) return { allowed: false, scope: null, reason: 'material-mismatch' };

        // Free materials: any logged-in user may view. (A valid `user` here
        // already means an authenticated, non-expired session.)
        return { allowed: true, scope: 'free-material' };
    }

    return { allowed: false, scope: null, reason: 'no-context' };
}
