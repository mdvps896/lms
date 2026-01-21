'use client';
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { FiArrowLeft, FiClock, FiCalendar, FiEye, FiDownload, FiCheckCircle, FiXCircle, FiSearch } from 'react-icons/fi';
import Swal from 'sweetalert2';

const ExamAttemptsPage = () => {
    const { user } = useAuth();
    const router = useRouter();
    const params = useParams();
    const examId = params.examId;

    const [exam, setExam] = useState(null);
    const [attempts, setAttempts] = useState([]);
    const [filteredAttempts, setFilteredAttempts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [settings, setSettings] = useState(null);
    const [filterStatus, setFilterStatus] = useState('all'); // all, passed, failed
    const [sortBy, setSortBy] = useState('recent'); // recent, score
    const [searchQuery, setSearchQuery] = useState('');
    const [downloadingCertificate, setDownloadingCertificate] = useState(null); // Store attempt ID being downloaded

    useEffect(() => {
        if (!user) {
            router.push('/authentication/login');
            return;
        }

        if (user.role !== 'student') {
            router.push('/');
            return;
        }

        fetchExamAttempts();
        fetchSettings();
    }, [user, examId]);

    useEffect(() => {
        applyFilters();
    }, [attempts, searchQuery, filterStatus, sortBy]);

    const applyFilters = () => {
        let filtered = [...attempts];

        // Search filter (by date)
        if (searchQuery) {
            filtered = filtered.filter(attempt => {
                const dateStr = formatDate(attempt.submittedAt || attempt.createdAt).toLowerCase();
                return dateStr.includes(searchQuery.toLowerCase());
            });
        }

        // Status filter
        if (filterStatus !== 'all') {
            filtered = filtered.filter(attempt => {
                if (filterStatus === 'passed') return attempt.passed;
                if (filterStatus === 'failed') return !attempt.passed;
                return true;
            });
        }

        // Sort
        filtered.sort((a, b) => {
            if (sortBy === 'recent') {
                return new Date(b.submittedAt || b.createdAt) - new Date(a.submittedAt || a.createdAt);
            }
            if (sortBy === 'score') {
                return (b.score || 0) - (a.score || 0);
            }
            return 0;
        });

        setFilteredAttempts(filtered);
    };

    const fetchExamAttempts = async () => {
        try {
            const response = await fetch(`/api/student/exam-attempts/${examId}`);
            const data = await response.json();

            if (data.success) {
                setExam(data.exam);
                // Sort attempts by date - newest first
                const sortedAttempts = (data.attempts || []).sort((a, b) => {
                    const dateA = new Date(a.submittedAt || a.createdAt);
                    const dateB = new Date(b.submittedAt || b.createdAt);
                    return dateB - dateA; // Descending order (newest first)
                });
                setAttempts(sortedAttempts);
            } else {
                Swal.fire('Error', data.message || 'Failed to fetch attempts', 'error');
            }
        } catch (error) {
            console.error('Error fetching exam attempts:', error);
            Swal.fire('Error', 'Failed to load exam attempts', 'error');
        } finally {
            setLoading(false);
        }
    };

    const fetchSettings = async () => {
        try {
            const response = await fetch('/api/settings');
            const data = await response.json();
            if (data.success) {
                setSettings(data.data);
            }
        } catch (error) {
            console.error('Error fetching settings:', error);
        }
    };

    const handleDownloadCertificate = async (attempt) => {
        setDownloadingCertificate(attempt._id);
        try {
            // Dynamic import
            const html2canvas = (await import('html2canvas')).default;
            const jsPDF = (await import('jspdf')).default;

            // Create temporary certificate container
            const tempDiv = document.createElement('div');
            tempDiv.style.position = 'fixed';
            tempDiv.style.top = '0';
            tempDiv.style.left = '-10000px';
            tempDiv.style.width = '1122px';
            tempDiv.style.height = '794px';
            tempDiv.style.zIndex = '-1000';
            document.body.appendChild(tempDiv);

            // Get site colors from settings
            const certConfig = settings?.certificateSettings || {};
            const primaryColor = certConfig.primaryColor || '#0891b2';
            const secondaryColor = certConfig.secondaryColor || '#4361ee';
            const siteName = certConfig.siteName || settings?.siteSettings?.siteName || 'Exam Portal';
            const tagline = certConfig.tagline || 'Excellence in Education';
            const backgroundColor = certConfig.backgroundColor || '#ffffff';
            const borderColor = certConfig.borderColor || primaryColor;
            const borderWidth = certConfig.borderWidth || 20;
            const watermarkOpacity = certConfig.watermarkOpacity || 0.03;
            const watermarkEnabled = certConfig.watermarkEnabled !== false;
            const titleFontSize = certConfig.titleFontSize || 48;
            const nameFontSize = certConfig.nameFontSize || 42;
            const bodyFontSize = certConfig.bodyFontSize || 18;
            const signatureTitle1 = certConfig.signatureTitle1 || 'Administrator';
            const signatureSubtitle1 = certConfig.signatureSubtitle1 || '';
            const signatureTitle2 = certConfig.signatureTitle2 || 'Examiner';
            const signatureSubtitle2 = certConfig.signatureSubtitle2 || 'Authorized Signatory';
            const sealText = certConfig.sealText || 'OFFICIAL SEAL';
            const showSeal = certConfig.showSeal !== false;
            const showCertificateId = certConfig.showCertificateId !== false;
            const showDate = certConfig.showDate !== false;
            const fontFamily = certConfig.fontFamily || 'Georgia, serif';

            const certificateDate = attempt?.submittedAt 
                ? new Date(attempt.submittedAt).toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                })
                : new Date().toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                });

            const certificateId = `CERT-${attempt._id?.slice(-8).toUpperCase() || 'XXXXXXXX'}`;

            // Create certificate HTML - simplified version
            const certificateHTML = document.createElement('div');
            certificateHTML.style.cssText = `
                width: 1122px;
                height: 794px;
                padding: 60px;
                background: linear-gradient(135deg, ${backgroundColor} 0%, #f8f9fa 100%);
                border: ${borderWidth}px solid ${borderColor};
                position: relative;
                font-family: ${fontFamily};
                box-sizing: border-box;
            `;

            certificateHTML.innerHTML = `
                <div style="
                    position: absolute;
                    top: 40px;
                    left: 40px;
                    right: 40px;
                    bottom: 40px;
                    border: 3px solid ${secondaryColor};
                "></div>
                
                ${watermarkEnabled ? `<div style="
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    font-size: 180px;
                    font-weight: bold;
                    color: rgba(0, 0, 0, ${watermarkOpacity});
                    z-index: 0;
                    white-space: nowrap;
                ">${siteName.toUpperCase()}</div>` : ''}
                
                <div style="position: relative; z-index: 1; height: 100%;">
                    ${showCertificateId ? `<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px;">
                        <div style="font-size: 12px; color: #666;">
                            <strong>Certificate ID:</strong> ${certificateId}
                        </div>
                    </div>` : ''}
                    
                    <div style="text-align: center; margin-bottom: 20px;">
                        <h1 style="
                            font-size: 32px;
                            font-weight: bold;
                            color: ${primaryColor};
                            margin: 0;
                            text-transform: uppercase;
                            letter-spacing: 2px;
                        ">${siteName}</h1>
                        <p style="font-size: 14px; color: #666; margin: 5px 0 0 0;">${tagline}</p>
                    </div>
                    
                    <div style="text-align: center; margin-bottom: 30px; margin-top: 30px;">
                        <h2 style="
                            font-size: ${titleFontSize}px;
                            font-weight: bold;
                            color: ${secondaryColor};
                            margin: 0;
                            text-transform: uppercase;
                            letter-spacing: 4px;
                        ">CERTIFICATE</h2>
                        <div style="
                            width: 200px;
                            height: 3px;
                            background: ${primaryColor};
                            margin: 15px auto;
                        "></div>
                        <p style="font-size: 18px; color: #666; margin: 10px 0 0 0; font-style: italic;">of Achievement</p>
                    </div>
                    
                    <div style="text-align: center; margin-top: 40px; margin-bottom: 40px;">
                        <p style="font-size: ${bodyFontSize}px; color: #333; margin-bottom: 20px;">This is to certify that</p>
                        
                        <h3 style="
                            font-size: ${nameFontSize}px;
                            font-weight: bold;
                            color: #000;
                            margin: 20px 0;
                            font-family: ${fontFamily};
                            font-style: italic;
                            border-bottom: 2px solid ${primaryColor};
                            padding-bottom: 10px;
                            display: inline-block;
                        ">${user?.name || 'Student Name'}</h3>
                        
                        <p style="font-size: ${bodyFontSize}px; color: #333; margin: 30px 60px; line-height: 1.8;">
                            has successfully completed the examination titled<br/>
                            <strong style="font-size: ${bodyFontSize + 4}px; color: ${primaryColor};">"${exam?.title || exam?.name || 'Exam Name'}"</strong><br/>
                            and achieved a score of<br/>
                            <strong style="font-size: ${bodyFontSize + 10}px; color: ${secondaryColor};">${attempt?.score?.toFixed(2) || '0.00'}%</strong>
                        </p>
                        
                        ${showDate ? `<p style="font-size: 16px; color: #666; margin-top: 30px;">
                            Awarded on <strong>${certificateDate}</strong>
                        </p>` : ''}
                    </div>
                    
                    <div style="
                        position: absolute;
                        bottom: 0;
                        left: 0;
                        right: 0;
                        display: flex;
                        justify-content: space-around;
                        padding-top: 20px;
                        border-top: 2px solid ${primaryColor};
                    ">
                        <div style="text-align: center; flex: 1;">
                            <div style="border-top: 2px solid #333; width: 200px; margin: 0 auto 10px;"></div>
                            <p style="margin: 0; font-size: 14px; font-weight: bold; color: #333;">${signatureTitle1}</p>
                            ${signatureSubtitle1 ? `<p style="margin: 0; font-size: 12px; color: #666;">${signatureSubtitle1}</p>` : ''}
                        </div>
                        
                        ${showSeal ? `<div style="text-align: center; flex: 1;">
                            <div style="
                                width: 80px;
                                height: 80px;
                                border: 3px solid ${primaryColor};
                                border-radius: 50%;
                                margin: 0 auto 10px;
                                display: flex;
                                align-items: center;
                                justify-content: center;
                                background: white;
                            ">
                                <div style="font-size: 12px; font-weight: bold; color: ${primaryColor}; text-align: center;">
                                    ${sealText.split(' ').join('<br/>')}
                                </div>
                            </div>
                        </div>` : ''}
                        
                        <div style="text-align: center; flex: 1;">
                            <div style="border-top: 2px solid #333; width: 200px; margin: 0 auto 10px;"></div>
                            <p style="margin: 0; font-size: 14px; font-weight: bold; color: #333;">${signatureTitle2}</p>
                            <p style="margin: 0; font-size: 12px; color: #666;">${signatureSubtitle2}</p>
                        </div>
                    </div>
                </div>
            `;

            tempDiv.appendChild(certificateHTML);

            // Wait for rendering
            await new Promise(resolve => setTimeout(resolve, 300));

            // Generate canvas with better options
            const canvas = await html2canvas(certificateHTML, {
                scale: 2,
                useCORS: true,
                allowTaint: true,
                logging: true,
                backgroundColor: '#ffffff',
                width: 1122,
                height: 794,
                windowWidth: 1122,
                windowHeight: 794
            });

            // Create PDF
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF({
                orientation: 'landscape',
                unit: 'mm',
                format: 'a4'
            });

            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();
            
            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
            
            const fileName = `certificate-${exam?.title || exam?.name || 'exam'}-${user?.name || 'student'}.pdf`;
            pdf.save(fileName);

            // Cleanup
            document.body.removeChild(tempDiv);
            
            Swal.fire('Success', 'Certificate downloaded successfully!', 'success');
            
        } catch (error) {
            console.error('Error generating certificate:', error);
            console.error('Error details:', error.message, error.stack);
            Swal.fire('Error', 'Failed to generate certificate: ' + error.message, 'error');
        } finally {
            setDownloadingCertificate(null);
        }
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const formatDuration = (seconds) => {
        const minutes = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${minutes}m ${secs}s`;
    };

    if (loading) {
        return (
            <div className="container-fluid">
                <div className="row">
                    <div className="col-12">
                        <div className="page-header">
                            <div className="page-header-left d-flex align-items-center">
                                <div className="skeleton skeleton-button me-3" style={{ width: '120px', height: '36px' }}></div>
                                <div className="flex-grow-1">
                                    <div className="skeleton skeleton-text mb-2" style={{ width: '300px', height: '24px' }}></div>
                                    <div className="skeleton skeleton-text" style={{ width: '180px', height: '14px' }}></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Skeleton for Exam Info Card */}
                <div className="row mb-4">
                    <div className="col-12">
                        <div className="card border-0 shadow-sm">
                            <div className="card-body">
                                <div className="row">
                                    {[1, 2, 3, 4].map((i) => (
                                        <div key={i} className="col-md-3">
                                            <div className="skeleton skeleton-text mb-2" style={{ width: '60%', height: '14px' }}></div>
                                            <div className="skeleton skeleton-text" style={{ width: '80%', height: '20px' }}></div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Skeleton for Attempts Table */}
                <div className="row">
                    <div className="col-12">
                        <div className="card border-0 shadow-sm">
                            <div className="card-header bg-white">
                                <div className="skeleton skeleton-text" style={{ width: '150px', height: '20px' }}></div>
                            </div>
                            <div className="card-body p-0">
                                <div className="table-responsive">
                                    <table className="table table-hover mb-0">
                                        <thead className="bg-light">
                                            <tr>
                                                <th><div className="skeleton skeleton-text" style={{ width: '80px', height: '16px' }}></div></th>
                                                <th><div className="skeleton skeleton-text" style={{ width: '80px', height: '16px' }}></div></th>
                                                <th><div className="skeleton skeleton-text" style={{ width: '80px', height: '16px' }}></div></th>
                                                <th><div className="skeleton skeleton-text" style={{ width: '80px', height: '16px' }}></div></th>
                                                <th><div className="skeleton skeleton-text" style={{ width: '80px', height: '16px' }}></div></th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {[1, 2, 3, 4, 5].map((i) => (
                                                <tr key={i}>
                                                    <td>
                                                        <div className="skeleton skeleton-text mb-2" style={{ width: '120px', height: '16px' }}></div>
                                                        <div className="skeleton skeleton-text" style={{ width: '100px', height: '14px' }}></div>
                                                    </td>
                                                    <td><div className="skeleton skeleton-text" style={{ width: '140px', height: '16px' }}></div></td>
                                                    <td><div className="skeleton skeleton-text" style={{ width: '120px', height: '16px' }}></div></td>
                                                    <td><div className="skeleton skeleton-badge" style={{ width: '70px', height: '24px' }}></div></td>
                                                    <td>
                                                        <div className="d-flex gap-2">
                                                            <div className="skeleton skeleton-button" style={{ width: '36px', height: '32px' }}></div>
                                                            <div className="skeleton skeleton-button" style={{ width: '36px', height: '32px' }}></div>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <style jsx>{`
                    .skeleton {
                        background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
                        background-size: 200% 100%;
                        animation: loading 1.5s infinite;
                        border-radius: 4px;
                    }
                    @keyframes loading {
                        0% { background-position: 200% 0; }
                        100% { background-position: -200% 0; }
                    }
                `}</style>
            </div>
        );
    }

    return (
        <div className="container-fluid">
            <div className="row">
                <div className="col-12">
                    <div className="page-header">
                        <div className="page-header-left d-flex align-items-center">
                            <Link href="/my-results" className="btn btn-sm btn-light me-3">
                                <FiArrowLeft className="me-2" />
                                Back to Results
                            </Link>
                            <div className="page-header-title">
                                <h5 className="m-b-10">{exam?.title}</h5>
                                <p className="text-muted small mb-0">Exam Result Details</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Exam Info Card */}
            <div className="row mb-4">
                <div className="col-12">
                    <div className="card border-0 shadow-sm">
                        <div className="card-body">
                            <div className="row g-3">{/* Added g-3 for gap */}
                                <div className="col-md-3">
                                    <div className="text-muted small">Subject</div>
                                    <div className="fw-bold">{exam?.subject?.name || 'N/A'}</div>
                                </div>
                                <div className="col-md-3">
                                    <div className="text-muted small">Duration</div>
                                    <div className="fw-bold">{exam?.duration} minutes</div>
                                </div>
                                <div className="col-md-3">
                                    <div className="text-muted small">Total Questions</div>
                                    <div className="fw-bold">{exam?.totalQuestions}</div>
                                </div>
                                <div className="col-md-3">
                                    <div className="text-muted small">Total Attempts</div>
                                    <div className="fw-bold">{attempts.length}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters Section */}
            <div className="row mb-4">
                <div className="col-12">
                    <div className="card border-0 shadow-sm">
                        <div className="card-body">
                            <div className="row g-3 align-items-center">
                                {/* Search */}
                                <div className="col-md-4">
                                    <div className="input-group">
                                        <span className="input-group-text bg-white">
                                            <FiSearch size={16} />
                                        </span>
                                        <input
                                            type="text"
                                            className="form-control"
                                            placeholder="Search by date..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                        />
                                    </div>
                                </div>

                                {/* Status Filter */}
                                <div className="col-md-3">
                                    <select
                                        className="form-select"
                                        value={filterStatus}
                                        onChange={(e) => setFilterStatus(e.target.value)}
                                    >
                                        <option value="all">All Status</option>
                                        <option value="passed">Passed Only</option>
                                        <option value="failed">Failed Only</option>
                                    </select>
                                </div>

                                {/* Sort By */}
                                <div className="col-md-3">
                                    <select
                                        className="form-select"
                                        value={sortBy}
                                        onChange={(e) => setSortBy(e.target.value)}
                                    >
                                        <option value="recent">Most Recent</option>
                                        <option value="score">Highest Score</option>
                                    </select>
                                </div>

                                {/* Results Count */}
                                <div className="col-md-2 text-end">
                                    <span className="text-muted">
                                        {filteredAttempts.length} {filteredAttempts.length === 1 ? 'attempt' : 'attempts'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Attempts List */}
            <div className="row">
                <div className="col-12">
                    <div className="card border-0 shadow-sm">
                        <div className="card-header bg-white">
                            <h6 className="mb-0">All Attempts</h6>
                        </div>
                        <div className="card-body p-0">
                            {filteredAttempts.length === 0 ? (
                                <div className="text-center py-5">
                                    <p className="text-muted">
                                        {attempts.length === 0 
                                            ? 'No attempts found for this exam.' 
                                            : 'No attempts match your filters.'}
                                    </p>
                                </div>
                            ) : (
                                <div className="table-responsive">
                                    <table className="table table-hover mb-0">
                                        <thead className="bg-light">
                                            <tr>
                                                <th>EXAM</th>
                                                <th>DATE</th>
                                                <th>SCORE</th>
                                                <th>STATUS</th>
                                                <th>ACTIONS</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredAttempts.map((attempt, index) => (
                                                <tr key={attempt._id}>
                                                    <td>
                                                        <div className="fw-bold">{exam?.title}</div>
                                                        <div className="text-muted small">
                                                            Duration: {attempt.timeTaken ? formatDuration(attempt.timeTaken) : 'N/A'}
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <div className="d-flex align-items-center">
                                                            <FiCalendar className="me-2 text-muted" size={14} />
                                                            <span>{formatDate(attempt.submittedAt || attempt.createdAt)}</span>
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <div className="d-flex align-items-center">
                                                            <div className="progress" style={{ width: '100px', height: '8px' }}>
                                                                <div
                                                                    className={`progress-bar ${
                                                                        attempt.resultStatus === 'draft' 
                                                                            ? 'bg-warning' 
                                                                            : attempt.score >= 50 ? 'bg-success' : 'bg-danger'
                                                                    }`}
                                                                    style={{ 
                                                                        width: attempt.resultStatus === 'draft' ? '100%' : `${attempt.score}%` 
                                                                    }}
                                                                ></div>
                                                            </div>
                                                            <span className="ms-2 fw-bold">
                                                                {attempt.resultStatus === 'draft' ? 'Checking' : `${attempt.score?.toFixed(2)}%`}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td>
                                                        {attempt.resultStatus === 'draft' ? (
                                                            <span className="badge bg-warning text-dark">
                                                                <FiClock className="me-1" size={12} />
                                                                Under Checking
                                                            </span>
                                                        ) : attempt.passed ? (
                                                            <span className="badge bg-success">
                                                                <FiCheckCircle className="me-1" size={12} />
                                                                Passed
                                                            </span>
                                                        ) : (
                                                            <span className="badge bg-danger">
                                                                <FiXCircle className="me-1" size={12} />
                                                                Failed
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td>
                                                        <div className="d-flex gap-2">
                                                            <Link
                                                                href={`/my-results/${examId}/${attempt._id}`}
                                                                className="btn btn-sm btn-primary"
                                                                title="View Details"
                                                            >
                                                                <FiEye size={14} />
                                                            </Link>
                                                            <button
                                                                className="btn btn-sm btn-success"
                                                                title="Download Certificate"
                                                                onClick={() => handleDownloadCertificate(attempt)}
                                                                disabled={downloadingCertificate === attempt._id}
                                                            >
                                                                {downloadingCertificate === attempt._id ? (
                                                                    <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                                                                ) : (
                                                                    <FiDownload size={14} />
                                                                )}
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ExamAttemptsPage;
