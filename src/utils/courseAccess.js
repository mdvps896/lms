/**
 * Server-side enrollment/access checks for paid course content.
 *
 * 🔒 SECURITY: this exists because the actual lecture content (a real
 * video/PDF/image URL, in `lecture.content`) was being returned to EVERYONE
 * who fetched a course — `GET /api/courses` and `GET /api/courses/[id]` did
 * not check enrollment at all. Any signed-up (free) account could read the
 * full curriculum of a paid course, copy the file URLs, and watch/download
 * the content without ever purchasing it. No response tampering was even
 * required — the server was already saying "yes" to everyone.
 *
 * These helpers make "is this user actually entitled to this content" a
 * single server-side, database-backed check, reused everywhere a course is
 * returned to a client.
 */

/**
 * 🔒 `getAuthenticatedUser()` returns the JWT PAYLOAD (role, permissions,
 * userId, ...) — it does NOT carry `enrolledCourses`, because that field was
 * never put in the token. Reading `user.enrolledCourses` off that object is
 * always `undefined`, silently treating every logged-in user as unenrolled.
 * Enrollment must be read from the User document itself, fetched fresh from
 * the database on every check — never cached in the token or trusted from
 * anything the client sent.
 *
 * @param {object|null} authUser  result of getAuthenticatedUser() — may be null
 * @param {string} courseId
 * @returns {Promise<{ enrolled: boolean, expired: boolean }>}
 */
export async function checkEnrollment(authUser, courseId) {
    if (!authUser || !courseId) return { enrolled: false, expired: false };

    // Admins/teachers manage course content directly — always full access.
    if (authUser.role === 'admin' || authUser.role === 'teacher') {
        return { enrolled: true, expired: false };
    }

    const userId = authUser.id || authUser._id?.toString();
    if (!userId) return { enrolled: false, expired: false };

    const { default: User } = await import('@/models/User');
    const dbUser = await User.findById(userId).select('enrolledCourses').lean();
    if (!dbUser) return { enrolled: false, expired: false };

    const enrolledCourses = dbUser.enrolledCourses || [];
    const targetId = courseId.toString();

    for (const entry of enrolledCourses) {
        if (!entry) continue;

        let entryId = '';
        let expiresAt = null;

        if (typeof entry === 'string' || (entry && entry.toString && !entry.courseId && !entry.course)) {
            // Legacy shape: enrolledCourses held raw ObjectId/string values.
            entryId = entry.toString();
        } else if (typeof entry === 'object') {
            const rawId = entry.courseId || entry.course || entry._id;
            entryId = rawId?._id ? rawId._id.toString() : (rawId ? rawId.toString() : '');
            expiresAt = entry.expiresAt || null;
        }

        if (entryId && entryId === targetId) {
            const expired = !!expiresAt && new Date() > new Date(expiresAt);
            return { enrolled: !expired, expired };
        }
    }

    return { enrolled: false, expired: false };
}

/**
 * Returns a curriculum array safe to send to `user` for `course`. Locked
 * lectures keep every field EXCEPT `content` — the client can still render
 * titles, types and lock icons, but never receives a playable/downloadable
 * URL for content it hasn't paid for.
 *
 * A lecture is unlocked when: the whole course is free, the lecture is
 * flagged `isDemo`, or the caller is enrolled (and not expired) / staff.
 */
export function sanitizeCurriculum(curriculum, { isCourseFree, enrolled }) {
    if (!Array.isArray(curriculum)) return curriculum;

    return curriculum.map((topic) => {
        const plainTopic = typeof topic.toObject === 'function' ? topic.toObject() : topic;
        const lectures = Array.isArray(plainTopic.lectures) ? plainTopic.lectures : [];

        return {
            ...plainTopic,
            lectures: lectures.map((lecture) => {
                const plainLecture = typeof lecture.toObject === 'function' ? lecture.toObject() : lecture;
                const unlocked = !!isCourseFree || !!plainLecture.isDemo || !!enrolled;

                if (unlocked) return plainLecture;

                const { content, ...locked } = plainLecture;
                return { ...locked, content: null, locked: true };
            })
        };
    });
}
