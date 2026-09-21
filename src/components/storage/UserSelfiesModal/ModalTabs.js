import React from 'react';

const ModalTabs = ({ activeTab, setActiveTab, subTab, setSubTab }) => {
    return (
        <>
            <div className="px-3 pt-3 border-bottom">
                <ul className="nav nav-tabs border-0">
                    <li className="nav-item">
                        <button
                            className={`nav-link ${activeTab === 'all' ? 'active' : ''}`}
                            onClick={() => setActiveTab('all')}
                        >
                            All
                        </button>
                    </li>
                    <li className="nav-item">
                        <button
                            className={`nav-link ${activeTab === 'courses' ? 'active' : ''}`}
                            onClick={() => setActiveTab('courses')}
                        >
                            Courses
                        </button>
                    </li>
                    <li className="nav-item">
                        <button
                            className={`nav-link ${activeTab === 'free_materials' ? 'active' : ''}`}
                            onClick={() => setActiveTab('free_materials')}
                        >
                            Free Materials
                        </button>
                    </li>
                </ul>
            </div>

            {activeTab === 'free_materials' && (
                <div className="px-3 pt-2 bg-light border-bottom">
                    <ul className="nav nav-pills nav-fill bg-white p-1 rounded-pill shadow-sm" style={{ maxWidth: '300px' }}>
                        <li className="nav-item">
                            <button
                                className={`nav-link rounded-pill py-1 ${subTab === 'pdf' ? 'active' : ''}`}
                                onClick={() => setSubTab('pdf')}
                            >
                                PDF
                            </button>
                        </li>
                        <li className="nav-item">
                            <button
                                className={`nav-link rounded-pill py-1 ${subTab === 'test' ? 'active' : ''}`}
                                onClick={() => setSubTab('test')}
                            >
                                Test
                            </button>
                        </li>
                    </ul>
                </div>
            )}
        </>
    );
};

export default ModalTabs;
