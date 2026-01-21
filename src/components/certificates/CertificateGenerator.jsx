'use client';
import React, { useRef } from 'react';
import { FiDownload } from 'react-icons/fi';

const CertificateGenerator = ({ attempt, exam, user, settings }) => {
    const certificateRef = useRef(null);

    const convertImageToBase64 = (url) => {
        return new Promise((resolve, reject) => {
            if (!url) {
                resolve('');
                return;
            }

            // Convert relative URLs to absolute
            let absoluteUrl = url;
            if (url.startsWith('/')) {
                absoluteUrl = window.location.origin + url;
            }

            const img = new Image();
            img.crossOrigin = 'anonymous';

            img.onload = () => {
                try {
                    const canvas = document.createElement('canvas');
                    canvas.width = img.naturalWidth;
                    canvas.height = img.naturalHeight;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0);
                    const dataURL = canvas.toDataURL('image/png');
                    resolve(dataURL);
                } catch (error) {
                    console.error('Failed to convert image to base64:', absoluteUrl, error);
                    resolve(''); // Return empty string on failure
                }
            };

            img.onerror = (e) => {
                console.error('Failed to load image for conversion:', absoluteUrl, e);
                resolve(''); // Return empty string on failure
            };

            img.src = absoluteUrl;
        });
    };

    const handleDownload = async () => {
        try {
            // Get certificate config
            const certConfig = settings?.certificateSettings || {};
            const signatureImage2 = certConfig.signatureImage2 || '';
            const siteLogo = settings?.siteSettings?.logo || certConfig.logo || '';

            const convertPromises = [];

            if (siteLogo) {
                convertPromises.push(convertImageToBase64(siteLogo));
            } else {
                convertPromises.push(Promise.resolve(''));
            }

            if (signatureImage2) {
                convertPromises.push(convertImageToBase64(signatureImage2));
            } else {
                convertPromises.push(Promise.resolve(''));
            }

            const [logoBase64, signatureBase64] = await Promise.all(convertPromises);
            // Dynamic import for client-side only
            const html2canvas = (await import('html2canvas')).default;
            const jsPDF = (await import('jspdf')).default;

            const element = certificateRef.current;

            if (!element) {
                console.error('Certificate element not found!');
                alert('Certificate element not ready. Please try again.');
                return;
            }

            // Replace image sources with base64
            const images = element.querySelectorAll('img');
            const originalSrcs = [];
            images.forEach((img, index) => {
                originalSrcs.push(img.src);
                if (img.alt === 'Logo') {
                    if (logoBase64) {
                        img.src = logoBase64;
                    } else {
                        console.warn('Logo base64 is empty, keeping original');
                    }
                } else if (img.alt === 'Signature') {
                    if (signatureBase64) {
                        img.src = signatureBase64;
                    } else {
                        console.warn('Signature base64 is empty, keeping original');
                    }
                }
            });

            // Wait for images to update
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Generate canvas from HTML
            const canvas = await html2canvas(element, {
                scale: 2,
                useCORS: true,
                allowTaint: true,
                logging: true,
                backgroundColor: '#ffffff'
            });

            // Restore original image sources
            images.forEach((img, index) => {
                img.src = originalSrcs[index];
            });

            // Convert to PDF
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF({
                orientation: 'landscape',
                unit: 'mm',
                format: 'a4'
            });

            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();

            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);

            const fileName = `certificate-${exam?.name || 'exam'}-${user?.name || 'student'}.pdf`;
            pdf.save(fileName);

        } catch (error) {
            console.error('Error generating certificate:', error);
            console.error('Error stack:', error.stack);
            alert('Failed to generate certificate: ' + error.message);
        }
    };

    // Get site colors from settings
    const certConfig = settings?.certificateSettings || {};
    const primaryColor = certConfig.primaryColor || settings?.siteSettings?.primaryColor || '#d946ef'; // Pink/Magenta
    const secondaryColor = certConfig.secondaryColor || settings?.siteSettings?.secondaryColor || '#8b5cf6'; // Purple
    const backgroundColor = certConfig.backgroundColor || '#ffffff';
    const borderColor = certConfig.borderColor || primaryColor;
    const borderWidth = certConfig.borderWidth || 20;
    const siteName = certConfig.siteName || settings?.siteSettings?.siteName || 'Exam Portal';
    const tagline = certConfig.tagline || 'Excellence in Education';
    const siteLogo = settings?.siteSettings?.logo || certConfig.logo || '/images/logo/logo.png';

    // Font settings
    const fontFamily = certConfig.fontFamily || 'Arial, sans-serif';
    const titleFontSize = certConfig.titleFontSize || 28;
    const nameFontSize = certConfig.nameFontSize || 48;
    const bodyFontSize = certConfig.bodyFontSize || 16;

    // Watermark settings
    const watermarkEnabled = false; // Disabled like the reference image
    const watermarkOpacity = certConfig.watermarkOpacity || 0.03;

    // Signature settings
    const signatureTitle1 = certConfig.signatureTitle1 || 'Administrator';
    const signatureSubtitle1 = certConfig.signatureSubtitle1 || siteName;
    const signatureTitle2 = certConfig.signatureTitle2 || 'Examiner';
    const signatureSubtitle2 = certConfig.signatureSubtitle2 || 'Authorized Signatory';
    const signatureImage1 = certConfig.signatureImage1 || '';
    const signatureImage2 = certConfig.signatureImage2 || '';

    // Display settings
    const showSeal = certConfig.showSeal !== false;
    const sealText = certConfig.sealText || 'OFFICIAL SEAL';
    const showCertificateId = certConfig.showCertificateId !== false;
    const showDate = certConfig.showDate !== false;

    // Calculate exam metrics
    const totalMarks = attempt?.totalQuestions || exam?.questions?.length || 0;
    const correctAnswers = attempt?.correctAnswers || 0;
    const obtainedMarks = correctAnswers;
    const duration = attempt?.timeTaken ? (attempt.timeTaken / 60).toFixed(1) : '0.0';
    const passingGrade = exam?.passingScore || 90;
    const status = (attempt?.score || 0) >= passingGrade ? 'PASSED' : 'FAILED';
    const statusColor = status === 'PASSED' ? '#22c55e' : '#ef4444';

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

    const certificateId = `CERT-${attempt?._id?.slice(-8).toUpperCase() || 'XXXXXXXX'}`;

    return (
        <div>
            {/* Download Button */}
            <button
                onClick={handleDownload}
                className="btn btn-success"
                style={{ backgroundColor: primaryColor, borderColor: primaryColor }}
                data-certificate-download
            >
                <FiDownload className="me-2" />
                Download Certificate
            </button>

            {/* Certificate (Hidden but rendered for PDF generation) */}
            <div style={{ position: 'absolute', left: '-9999px', top: 0 }}>
                <div
                    ref={certificateRef}
                    style={{
                        width: '1122px',
                        height: '794px',
                        padding: '0',
                        background: '#f5f5f5',
                        position: 'relative',
                        fontFamily: fontFamily,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}
                >
                    {/* Outer Border - Dynamic Color */}
                    <div style={{
                        width: '1042px',
                        height: '714px',
                        background: 'white',
                        border: `20px solid ${borderColor}`,
                        position: 'relative'
                    }}>
                        {/* Inner Border - Secondary Color */}
                        <div style={{
                            position: 'absolute',
                            top: '20px',
                            left: '20px',
                            right: '20px',
                            bottom: '20px',
                            border: `8px solid ${secondaryColor}`,
                            padding: '40px',
                            display: 'flex',
                            flexDirection: 'column'
                        }}>
                            {/* Content Container */}
                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>

                                {/* Header - Site Name (No Logo) */}
                                <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                                    <h1 style={{
                                        fontSize: '24px',
                                        fontWeight: '600',
                                        color: '#333',
                                        margin: '0',
                                        letterSpacing: '1px'
                                    }}>
                                        {siteName}
                                    </h1>
                                </div>

                                {/* Certificate Title */}
                                <div style={{ textAlign: 'center', marginBottom: '30px' }}>
                                    <h2 style={{
                                        fontSize: `${titleFontSize}px`,
                                        color: '#6b7280',
                                        margin: '0 0 10px 0',
                                        fontWeight: '400',
                                        letterSpacing: '2px'
                                    }}>
                                        Certificate of Participation
                                    </h2>
                                </div>

                                {/* This certificate is proudly presented to */}
                                <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                                    <p style={{
                                        fontSize: '16px',
                                        color: '#9ca3af',
                                        margin: '0',
                                        fontStyle: 'italic'
                                    }}>
                                        This certificate is proudly presented to
                                    </p>
                                </div>

                                {/* Student Name */}
                                <div style={{ textAlign: 'center', marginBottom: '30px' }}>
                                    <h3 style={{
                                        fontSize: `${nameFontSize}px`,
                                        fontWeight: 'bold',
                                        color: secondaryColor,
                                        margin: '0',
                                        letterSpacing: '1px'
                                    }}>
                                        {user?.name || 'Student Name'}
                                    </h3>
                                </div>

                                {/* For participating in examination */}
                                <div style={{ textAlign: 'center', marginBottom: '15px' }}>
                                    <p style={{
                                        fontSize: '14px',
                                        color: '#6b7280',
                                        margin: '0 0 5px 0'
                                    }}>
                                        for participating in the examination
                                    </p>
                                    <p style={{
                                        fontSize: '20px',
                                        fontWeight: 'bold',
                                        color: '#1f2937',
                                        margin: '0'
                                    }}>
                                        ({exam?.name || exam?.examName || attempt?.examName || 'Exam Name'})
                                    </p>
                                </div>

                                {/* Metrics Row */}
                                <div style={{
                                    display: 'flex',
                                    justifyContent: 'space-around',
                                    alignItems: 'center',
                                    marginTop: '40px',
                                    marginBottom: '40px',
                                    padding: '0 60px'
                                }}>
                                    {/* Score */}
                                    <div style={{ textAlign: 'center', flex: 1 }}>
                                        <div style={{
                                            fontSize: '32px',
                                            fontWeight: 'bold',
                                            color: statusColor,
                                            marginBottom: '5px'
                                        }}>
                                            {attempt?.score?.toFixed(2) || '0.00'}%
                                        </div>
                                        <div style={{ fontSize: '14px', color: '#6b7280' }}>
                                            Score
                                        </div>
                                    </div>

                                    {/* Marks */}
                                    <div style={{ textAlign: 'center', flex: 1 }}>
                                        <div style={{
                                            fontSize: '32px',
                                            fontWeight: 'bold',
                                            color: '#1f2937',
                                            marginBottom: '5px'
                                        }}>
                                            {obtainedMarks}/{totalMarks}
                                        </div>
                                        <div style={{ fontSize: '14px', color: '#6b7280' }}>
                                            Marks
                                        </div>
                                    </div>

                                    {/* Status */}
                                    <div style={{ textAlign: 'center', flex: 1 }}>
                                        <div style={{
                                            fontSize: '28px',
                                            fontWeight: 'bold',
                                            color: statusColor,
                                            marginBottom: '5px'
                                        }}>
                                            {status}
                                        </div>
                                        <div style={{ fontSize: '14px', color: '#6b7280' }}>
                                            Status
                                        </div>
                                    </div>

                                    {/* Duration */}
                                    <div style={{ textAlign: 'center', flex: 1 }}>
                                        <div style={{
                                            fontSize: '28px',
                                            fontWeight: 'bold',
                                            color: '#1f2937',
                                            marginBottom: '5px'
                                        }}>
                                            {duration} min
                                        </div>
                                        <div style={{ fontSize: '14px', color: '#6b7280' }}>
                                            Duration
                                        </div>
                                    </div>
                                </div>

                                {/* Participated Badge */}
                                <div style={{
                                    textAlign: 'center',
                                    marginTop: '20px',
                                    marginBottom: '40px'
                                }}>
                                    <div style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        width: '100px',
                                        height: '100px',
                                        borderRadius: '50%',
                                        background: '#3b82f6',
                                        position: 'relative'
                                    }}>
                                        <div style={{
                                            position: 'absolute',
                                            top: '50%',
                                            left: '50%',
                                            transform: 'translate(-50%, -50%)',
                                            width: '60px',
                                            height: '60px',
                                            borderRadius: '50%',
                                            background: '#3b82f6',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center'
                                        }}>
                                            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" style={{ color: 'white' }}>
                                                <path d="M20 6L9 17L4 12" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                                            </svg>
                                        </div>
                                        <div style={{
                                            position: 'absolute',
                                            bottom: '-25px',
                                            background: '#3b82f6',
                                            color: 'white',
                                            padding: '4px 16px',
                                            borderRadius: '12px',
                                            fontSize: '12px',
                                            fontWeight: 'bold',
                                            whiteSpace: 'nowrap'
                                        }}>
                                            PARTICIPATED
                                        </div>
                                    </div>
                                </div>

                                {/* Footer Section */}
                                <div style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'flex-end',
                                    marginTop: 'auto',
                                    paddingTop: '30px',
                                    borderTop: '1px solid #e5e7eb'
                                }}>
                                    {/* Left - Signature */}
                                    <div style={{ textAlign: 'left', flex: 1 }}>
                                        {signatureImage2 && (
                                            <img
                                                src={signatureImage2}
                                                alt="Signature"
                                                crossOrigin="anonymous"
                                                onError={(e) => console.error('Failed to load signature2:', signatureImage2)}
                                                style={{
                                                    height: '40px',
                                                    width: 'auto',
                                                    marginBottom: '5px'
                                                }}
                                            />
                                        )}
                                        <div style={{
                                            borderTop: '2px solid #333',
                                            width: '150px',
                                            marginBottom: '5px'
                                        }} />
                                        <p style={{
                                            margin: '0',
                                            fontSize: '12px',
                                            color: '#1f2937',
                                            fontWeight: '600'
                                        }}>
                                            Authorized Signatory
                                        </p>
                                    </div>

                                    {/* Center - Date */}
                                    <div style={{ textAlign: 'center', flex: 1 }}>
                                        <div style={{
                                            fontSize: '18px',
                                            fontWeight: 'bold',
                                            color: '#1f2937',
                                            marginBottom: '5px'
                                        }}>
                                            {certificateDate}
                                        </div>
                                        <div style={{ fontSize: '12px', color: '#6b7280' }}>
                                            Issue Date
                                        </div>
                                    </div>

                                    {/* Right - Passing Grade */}
                                    <div style={{ textAlign: 'right', flex: 1 }}>
                                        <div style={{
                                            fontSize: '24px',
                                            fontWeight: 'bold',
                                            color: '#1f2937',
                                            marginBottom: '5px'
                                        }}>
                                            {passingGrade}%
                                        </div>
                                        <div style={{ fontSize: '12px', color: '#6b7280' }}>
                                            Passing Grade
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CertificateGenerator;
