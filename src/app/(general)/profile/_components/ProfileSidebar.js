'use client'

import React from 'react'
import AccountInfoCard from './AccountInfoCard'
import CategoryCard from './CategoryCard'
import SubjectsCard from './SubjectsCard'

const ProfileSidebar = ({ user, categoryLoading, categoryData, subjects }) => {
    return (
        <div className="col-lg-4">
            <AccountInfoCard user={user} />

            {user?.role === 'student' && (
                <>
                    <CategoryCard categoryLoading={categoryLoading} categoryData={categoryData} />
                    <SubjectsCard
                        categoryLoading={categoryLoading}
                        subjects={subjects}
                        categoryData={categoryData}
                    />
                </>
            )}
        </div>
    )
}

export default ProfileSidebar
