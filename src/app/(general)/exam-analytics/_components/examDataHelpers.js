// Business-logic helpers for fetching and shaping exam analytics data.
// Extracted from page.js as a pure refactor — no behavior changes.

export const fetchExamAnalyticsData = async (examId) => {
    // Mock exam analytics data
    const mockAnalytics = {
        totalAttempts: 8,
        completedAttempts: 8,
        averageScore: 6.04,
        highestScore: { score: 7, total: 29 },
        topPerformers: [
            { id: 1, name: 'John Doe', email: 'john@example.com', score: 24, percentage: 96, timeSpent: 85, correctAnswers: 24, wrongAnswers: 1 },
            { id: 2, name: 'Jane Smith', email: 'jane@example.com', score: 22, percentage: 88, timeSpent: 92, correctAnswers: 22, wrongAnswers: 3 },
            { id: 3, name: 'Mike Johnson', email: 'mike@example.com', score: 21, percentage: 84, timeSpent: 78, correctAnswers: 21, wrongAnswers: 4 }
        ],
        mostMissedQuestions: [
            { id: 1, question: 'What is the derivative of sin(x)?', incorrectCount: 6, totalAttempts: 8, percentage: 75 },
            { id: 2, question: 'Solve for x: 2x + 5 = 15', incorrectCount: 5, totalAttempts: 8, percentage: 62.5 },
            { id: 3, question: 'What is the integral of x²?', incorrectCount: 4, totalAttempts: 8, percentage: 50 }
        ]
    };
    return mockAnalytics;
};

export const fetchRealExamAnalyticsData = async (examId) => {
    // Fetch real topic and question data
    const response = await fetch(`/api/exam-analytics/${examId}`);
    if (response.ok) {
        const data = await response.json();
        if (data.success) {
            return {
                topicBreakdown: data.topicBreakdown || [],
                questionAnalysis: data.questionAnalysis || []
            };
        }
    }
    return { topicBreakdown: [], questionAnalysis: [] };
};

export const buildExamDetailData = (exam, realTopicData, realQuestionData) => {
    // Fetch real analytics data (questions and topics) is done by the caller before invoking this.

    // Calculate real statistics from attempts
    const attempts = exam.attempts || [];
    const completedAttempts = attempts.filter(a => a.status === 'submitted' || a.status === 'expired');

    let totalScore = 0;
    let maxScore = 0;
    let minScore = 100;
    let passCount = 0;

    const scoreRanges = {
        '90-100': 0,
        '80-89': 0,
        '70-79': 0,
        '60-69': 0,
        '50-59': 0,
        '0-49': 0
    };

    completedAttempts.forEach(attempt => {
        const score = attempt.score || 0;
        totalScore += score;
        maxScore = Math.max(maxScore, score);
        minScore = Math.min(minScore, score);

        if (attempt.passed) passCount++;

        // Score distribution
        if (score >= 90) scoreRanges['90-100']++;
        else if (score >= 80) scoreRanges['80-89']++;
        else if (score >= 70) scoreRanges['70-79']++;
        else if (score >= 60) scoreRanges['60-69']++;
        else if (score >= 50) scoreRanges['50-59']++;
        else scoreRanges['0-49']++;
    });

    const averageScore = completedAttempts.length > 0 ? (totalScore / completedAttempts.length).toFixed(2) : 0;
    const passPercentage = completedAttempts.length > 0 ? ((passCount / completedAttempts.length) * 100).toFixed(1) : 0;

    // Build score distribution array
    const scoreDistribution = Object.entries(scoreRanges).map(([range, count]) => ({
        range,
        count,
        percentage: completedAttempts.length > 0 ? ((count / completedAttempts.length) * 100).toFixed(1) : 0
    }));

    // Get recent submissions with real user data
    const recentSubmissions = completedAttempts
        .sort((a, b) => new Date(b.submittedAt || b.updatedAt) - new Date(a.submittedAt || a.updatedAt))
        .slice(0, 5)
        .map(attempt => {
            let grade = 'F';
            const score = attempt.score || 0;
            if (score >= 90) grade = 'A';
            else if (score >= 80) grade = 'B+';
            else if (score >= 70) grade = 'B';
            else if (score >= 60) grade = 'C+';
            else if (score >= 50) grade = 'C';

            return {
                studentId: attempt.userId?.toString() || 'Unknown',
                name: attempt.userName || 'Student',
                score: score,
                completionTime: attempt.timeTaken || 0,
                submittedAt: attempt.submittedAt || attempt.updatedAt,
                grade: grade
            };
        });

    const detailData = {
        id: exam._id.toString(),
        title: exam.title,
        subject: exam.subject?.name || 'N/A',
        description: exam.description || '',
        status: new Date(exam.endDate) < new Date() ? 'completed' : 'active',
        difficulty: exam.difficulty || 'Medium',
        totalQuestions: exam.questions?.length || 0,
        duration: exam.duration || 120,
        participants: completedAttempts.length,
        averageScore: parseFloat(averageScore),
        completionDate: exam.endDate ? new Date(exam.endDate).toISOString().split('T')[0] : null,
        maxScore: maxScore || 0,
        minScore: completedAttempts.length > 0 ? minScore : 0,
        passPercentage: parseFloat(passPercentage),
        topicBreakdown: realTopicData.length > 0 ? realTopicData : [],
        scoreDistribution: scoreDistribution,
        timeAnalysis: {
            averageTime: Math.floor(exam.duration * 0.85),
            fastestCompletion: Math.floor(exam.duration * 0.6),
            slowestCompletion: exam.duration,
            timeDistribution: [
                { range: `${Math.floor(exam.duration * 0.6)}-${Math.floor(exam.duration * 0.7)} min`, count: 0, percentage: 0 },
                { range: `${Math.floor(exam.duration * 0.7)}-${Math.floor(exam.duration * 0.8)} min`, count: 0, percentage: 0 },
                { range: `${Math.floor(exam.duration * 0.8)}-${Math.floor(exam.duration * 0.9)} min`, count: 0, percentage: 0 },
                { range: `${Math.floor(exam.duration * 0.9)}-${exam.duration} min`, count: 0, percentage: 0 }
            ]
        },
        questionAnalysis: realQuestionData.length > 0 ? realQuestionData : [],
        recentSubmissions: recentSubmissions
    };

    return detailData;
};
