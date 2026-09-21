export const getRoleBadgeClass = (role) => {
    switch (role) {
        case 'admin':
            return 'bg-soft-danger text-danger'
        case 'teacher':
            return 'bg-soft-warning text-warning'
        case 'student':
            return 'bg-soft-success text-success'
        default:
            return 'bg-soft-info text-info'
    }
}
