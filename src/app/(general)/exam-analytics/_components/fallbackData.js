export const getFallbackExams = () => {
    return [
        {
            id: '1',
            title: 'mah exam',
            subject: 'BCA',
            description: 'Comprehensive BCA examination covering Python and Java programming',
            totalQuestions: 50,
            duration: 133,
            totalStudents: 0,
            averageScore: 0,
            highestScore: 0,
            lowestScore: 0,
            passRate: 0,
            status: 'completed',
            createdAt: new Date('2025-12-03'),
            completedAt: new Date('2025-12-04'),
            difficulty: 'Medium'
        },
        {
            id: '2',
            title: 'Python Programming Test',
            subject: 'Python',
            description: 'Advanced Python programming assessment',
            totalQuestions: 40,
            duration: 90,
            totalStudents: 0,
            averageScore: 0,
            highestScore: 0,
            lowestScore: 0,
            passRate: 0,
            status: 'active',
            createdAt: new Date('2025-11-28'),
            completedAt: null,
            difficulty: 'Hard'
        }
    ];
};
