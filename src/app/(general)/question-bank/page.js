import React from 'react';
import QuestionList from '@/components/questions/QuestionList';

export const metadata = {
    title: 'Questions | Duralux',
    description: 'Manage questions bank'
};

const QuestionsPage = () => {
    return (
        <div className="container-fluid p-4">
            <div className="row">
                <div className="col-12">
                    <div className="page-title-box d-sm-flex align-items-center justify-content-between mb-4">
                        <h4 className="mb-sm-0">Questions Bank</h4>
                        <div className="page-title-right">
                            <ol className="breadcrumb m-0">
                                <li className="breadcrumb-item"><a href="#">Duralux</a></li>
                                <li className="breadcrumb-item active">Questions</li>
                            </ol>
                        </div>
                    </div>
                </div>
            </div>
            <QuestionList />
        </div>
    );
};

export default QuestionsPage;
