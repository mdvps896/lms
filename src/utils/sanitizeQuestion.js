/**
 * Answer-key stripping for question payloads sent to exam takers.
 *
 * 🔒 SECURITY: `GET /api/exams/[id]` used to return raw Question documents,
 * including `options[].isCorrect`, to every authenticated user. Any student
 * could read the complete answer key straight from the API before starting.
 * Anything that hands questions to a non-admin/teacher must run them through
 * stripAnswerKey first.
 */

/** True when this role is allowed to see which options are correct. */
export function canSeeAnswerKey(user) {
    return !!user && (user.role === 'admin' || user.role === 'teacher');
}

/** Remove `isCorrect` from a single question's options. Accepts lean docs. */
export function stripAnswerKey(question) {
    if (!question) return question;

    const plain = typeof question.toObject === 'function' ? question.toObject() : question;
    const { correctAnswer, correctAnswers, answer, explanation, solution, ...rest } = plain;

    return {
        ...rest,
        options: Array.isArray(plain.options)
            ? plain.options.map((opt) => {
                  if (!opt || typeof opt !== 'object') return opt;
                  const { isCorrect, ...safeOption } = opt;
                  return safeOption;
              })
            : plain.options
    };
}

/** Map stripAnswerKey over a list of questions. */
export function stripAnswerKeys(questions) {
    return Array.isArray(questions) ? questions.map(stripAnswerKey) : questions;
}
