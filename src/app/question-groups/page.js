import ProtectedRoute from '@/components/shared/ProtectedRoute';
import Header from '@/components/shared/header/Header';
import NavigationManu from '@/components/shared/navigationMenu/NavigationMenu';
import QuestionGroupList from '@/components/questionGroups/QuestionGroupList';

export default function QuestionGroupsPage() {
    return (
        <ProtectedRoute>
            <Header />
            <NavigationManu />
            <main className="nxl-container">
                <div className="nxl-content">
                    <div className="page-header">
                        <div className="page-header-left d-flex align-items-center">
                            <div className="page-header-title">
                                <h5 className="m-b-10">Question Groups</h5>
                            </div>
                        </div>
                    </div>

                    <div className="main-content">
                        <div className="row">
                            <div className="col-lg-12">
                                <QuestionGroupList />
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </ProtectedRoute>
    );
}
