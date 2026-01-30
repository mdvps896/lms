'use client'

import React from 'react'
import SiteOverviewStatistics from '@/components/widgetsStatistics/SiteOverviewStatistics'
import RecentActivityStatistics from '@/components/widgetsStatistics/RecentActivityStatistics'
import RecentUsersStatistics from '@/components/widgetsStatistics/RecentUsersStatistics'
import StudentDashboard from '@/components/students/StudentDashboard'
import DuplicateLayout from './duplicateLayout'
import { useAuth } from '@/contexts/AuthContext'
import ProtectedRoute from '@/components/shared/ProtectedRoute'

const Home = () => {
  const { user } = useAuth()

  return (
    <ProtectedRoute>
      <DuplicateLayout>
        <div className='main-content'>
          {user?.role === 'student' ? (
            <StudentDashboard />
          ) : (
            <>
              <div className='row'>
                <SiteOverviewStatistics />
              </div>
              <div className='row'>
                <RecentActivityStatistics />
                {(user?.role === 'admin' || (user?.role === 'teacher' && user?.permissions?.includes('manage_students'))) && (
                  <RecentUsersStatistics />
                )}
              </div>
            </>
          )}
        </div>
      </DuplicateLayout>
    </ProtectedRoute>
  )
}

export default Home