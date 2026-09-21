// Groups a flat list of attempts into per-user buckets, preserving the
// original grouping/order logic used on the Recorded Exams page.
export function groupAttemptsByUser(attempts) {
    const userGroups = {};
    attempts.forEach((attempt) => {
        const userId = attempt.user?._id || 'unknown';
        if (!userGroups[userId]) {
            userGroups[userId] = {
                user: attempt.user,
                attempts: []
            };
        }
        userGroups[userId].attempts.push(attempt);
    });

    return Object.values(userGroups);
}
