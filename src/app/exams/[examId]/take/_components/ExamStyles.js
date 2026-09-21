'use client';
// Global styles for the exam-taking layout, extracted verbatim from page.js.
export default function ExamStyles() {
    return (
        <style jsx global>{`
            .exam-body {
                display: flex;
                height: calc(100vh - 60px);
                overflow: hidden;
                position: relative;
            }
            .exam-main {
                flex: 1;
                overflow: auto;
                padding: 20px;
            }
            .sidebar-container {
                width: 300px;
                height: 100%;
                border-left: 1px solid #dee2e6;
                background: white;
                display: flex;
                flex-direction: column;
            }
            @media (max-width: 768px) {
                .exam-main {
                    padding: 10px;
                }
                .sidebar-container {
                    position: fixed;
                    top: 0;
                    left: 0;
                    bottom: 0;
                    width: 85%;
                    max-width: 300px;
                    z-index: 1050;
                    transform: translateX(-100%);
                    transition: transform 0.3s ease-in-out;
                    border-left: none;
                    border-right: 1px solid #dee2e6;
                    height: 100vh;
                    box-shadow: 2px 0 8px rgba(0,0,0,0.15);
                }
                .sidebar-container.open {
                    transform: translateX(0);
                }
                .sidebar-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0, 0, 0, 0.5);
                    z-index: 1040;
                    backdrop-filter: blur(2px);
                }
                .sidebar-header-mobile {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 10px 15px;
                    border-bottom: 1px solid #eee;
                    background: #f8f9fa;
                }
                /* Prevent zoom on inputs */
                input[type="text"], input[type="number"], textarea {
                    font-size: 16px !important;
                }
            }
        `}</style>
    );
}
