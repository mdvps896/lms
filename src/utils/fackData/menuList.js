export const menuList = [
    {
        id: 0,
        name: "dashboard",
        path: "/",
        icon: 'feather-airplay',
        roles: ['admin', 'teacher', 'student'], // All can see
        dropdownMenu: []
    },
    {
        id: 1,
        name: "teachers",
        path: "/teachers",
        icon: 'feather-user-check',
        roles: ['admin'], // Only admin can manage teachers
        dropdownMenu: []
    },
    {
        id: 2,
        name: "students",
        path: "/students",
        icon: 'feather-users',
        roles: ['admin', 'teacher'],
        permission: 'manage_students',
        dropdownMenu: []
    },
    {
        id: 3,
        name: "exam",
        path: "/exam",
        icon: 'feather-file-text',
        roles: ['admin', 'teacher'],
        permission: 'manage_exams',
        dropdownMenu: []
    },
    {
        id: 4,
        name: "subjects",
        path: "/subjects",
        icon: 'feather-book',
        roles: ['admin', 'teacher'],
        permission: 'manage_academic',
        dropdownMenu: []
    },
    {
        id: 5,
        name: "categories",
        path: "/categories",
        icon: 'feather-grid',
        roles: ['admin', 'teacher'],
        permission: 'manage_academic',
        dropdownMenu: []
    },
    {
        id: 5.5,
        name: "courses",
        path: "/courses",
        icon: 'feather-layers',
        roles: ['admin', 'teacher'],
        permission: 'manage_courses',
        dropdownMenu: []
    },
    {
        id: 6,
        name: "questions",
        path: "/question-bank",
        icon: 'feather-help-circle',
        roles: ['admin', 'teacher'],
        permission: 'manage_questions',
        dropdownMenu: [],
        showModal: true
    },
    {
        id: 7,
        name: "Analytics",
        path: "/analytics",
        icon: 'feather-pie-chart',
        roles: ['admin', 'teacher'],
        permission: 'view_analytics',
        dropdownMenu: []
    },
    {
        id: 7.5,
        name: "Coupons",
        path: "/coupons",
        icon: 'feather-tag',
        roles: ['admin'], // Only admin
        dropdownMenu: []
    },
    {
        id: 7.7,
        name: "Payments",
        path: "/payment/list",
        icon: 'feather-dollar-sign',
        roles: ['admin'],
        dropdownMenu: []
    },
    {
        id: 8,
        name: "live exam",
        path: "/live-exams",
        icon: 'feather-video',
        roles: ['admin', 'teacher'],
        permission: 'manage_live_exams',
        dropdownMenu: []
    },
    {
        id: 9,
        name: "recorded exams",
        path: "/recorded-exams",
        icon: 'feather-film',
        roles: ['admin', 'teacher'],
        permission: 'manage_content',
        dropdownMenu: []
    },
    {
        id: 9.5,
        name: "Google Meet",
        path: "/google-meet",
        icon: 'feather-video-off',
        roles: ['admin', 'teacher'],
        permission: 'manage_live_exams',
        dropdownMenu: []
    },
    {
        id: 9.8,
        name: "Free Materials",
        path: "/free-materials",
        icon: 'feather-archive',
        roles: ['admin', 'teacher'],
        permission: 'manage_content',
        dropdownMenu: []
    },
    {
        id: 10,
        name: "media & storage",
        path: "/storage",
        icon: 'feather-database',
        roles: ['admin', 'teacher'],
        permission: 'manage_storage',
        dropdownMenu: []
    },
    {
        id: 11,
        name: "settings",
        path: "/settings",
        icon: 'feather-settings',
        roles: ['admin'], // Only admin
        dropdownMenu: []
    },
    {
        id: 11.5,
        name: "Support Chat",
        path: "/support",
        icon: 'feather-message-circle',
        roles: ['admin'],
        dropdownMenu: []
    },
    // Student specific menu items
    {
        id: 12,
        name: "my exams",
        path: "/my-exams",
        icon: 'feather-clipboard',
        roles: ['student'], // Only students
        dropdownMenu: []
    },
    {
        id: 13,
        name: "my results",
        path: "/my-results",
        icon: 'feather-award',
        roles: ['student'], // Only students
        dropdownMenu: []
    },
    {
        id: 14,
        name: "my profile",
        path: "/profile",
        icon: 'feather-user',
        roles: ['admin', 'teacher', 'student'], // All can see
        dropdownMenu: []
    }
]