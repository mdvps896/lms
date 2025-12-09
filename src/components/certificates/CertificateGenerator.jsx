'use client';
import React, { useRef } from 'react';
import { FiDownload } from 'react-icons/fi';

const CertificateGenerator = ({ attempt, exam, user, settings }) => {
    const certificateRef = useRef(null);

    const handleDownload = async () => {
        try {
            console.log('Starting certificate download...');
            console.log('Attempt:', attempt);
            console.log('Exam:', exam);
            console.log('User:', user);
            
            // Dynamic import for client-side only
            const html2canvas = (await import('html2canvas')).default;
            const jsPDF = (await import('jspdf')).default;

            const element = certificateRef.current;
            
            if (!element) {
                console.error('Certificate element not found!');
                alert('Certificate element not ready. Please try again.');
                return;
            }
            
            console.log('Generating canvas from HTML...');
            
            // Generate canvas from HTML
            const canvas = await html2canvas(element, {
                scale: 2,
                useCORS: true,
                logging: true,
                backgroundColor: '#ffffff'
            });

            console.log('Canvas generated, creating PDF...');

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
            console.log('Saving PDF:', fileName);
            
            pdf.save(fileName);
            
            console.log('Certificate downloaded successfully!');
        } catch (error) {
            console.error('Error generating certificate:', error);
            console.error('Error stack:', error.stack);
            alert('Failed to generate certificate: ' + error.message);
        }
    };

    // Get site colors from settings
    const certConfig = settings?.certificateSettings || {};
    const primaryColor = certConfig.primaryColor || settings?.siteSettings?.primaryColor || '#0891b2';
    const secondaryColor = certConfig.secondaryColor || settings?.siteSettings?.secondaryColor || '#4361ee';
    const backgroundColor = certConfig.backgroundColor || '#ffffff';
    const borderColor = certConfig.borderColor || primaryColor;
    const borderWidth = certConfig.borderWidth || 20;
    const siteName = certConfig.siteName || settings?.siteSettings?.siteName || 'Exam Portal';
    const tagline = certConfig.tagline || 'Excellence in Education';
    const siteLogo = settings?.siteSettings?.logo || '/images/logo/logo.png';
    
    // Font settings
    const fontFamily = certConfig.fontFamily || 'Georgia, serif';
    const titleFontSize = certConfig.titleFontSize || 48;
    const nameFontSize = certConfig.nameFontSize || 42;
    const bodyFontSize = certConfig.bodyFontSize || 18;
    
    // Watermark settings
    const watermarkEnabled = certConfig.watermarkEnabled !== false;
    const watermarkOpacity = certConfig.watermarkOpacity || 0.03;
    
    // Signature settings
    const signatureTitle1 = certConfig.signatureTitle1 || 'Administrator';
    const signatureSubtitle1 = certConfig.signatureSubtitle1 || siteName;
    const signatureTitle2 = certConfig.signatureTitle2 || 'Examiner';
    const signatureSubtitle2 = certConfig.signatureSubtitle2 || 'Authorized Signatory';
    
    // Display settings
    const showSeal = certConfig.showSeal !== false;
    const sealText = certConfig.sealText || 'OFFICIAL SEAL';
    const showCertificateId = certConfig.showCertificateId !== false;
    const showDate = certConfig.showDate !== false;

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
                        padding: '60px',
                        background: backgroundColor,
                        border: `${borderWidth}px solid ${borderColor}`,
                        borderRadius: '0',
                        position: 'relative',
                        fontFamily: fontFamily
                    }}
                >
                    {/* Decorative Border */}
                    <div style={{
                        position: 'absolute',
                        top: '40px',
                        left: '40px',
                        right: '40px',
                        bottom: '40px',
                        border: `3px solid ${secondaryColor}`,
                        borderRadius: '0'
                    }} />

                    {/* Watermark */}
                    {watermarkEnabled && (
                        <div style={{
                            position: 'absolute',
                            top: '50%',
                            left: '50%',
                            transform: 'translate(-50%, -50%)',
                            fontSize: '180px',
                            fontWeight: 'bold',
                            color: `rgba(0, 0, 0, ${watermarkOpacity})`,
                            zIndex: 0,
                            whiteSpace: 'nowrap'
                        }}>
                            {siteName.toUpperCase()}
                        </div>
                    )}

                    {/* Content Container */}
                    <div style={{ position: 'relative', zIndex: 1, height: '100%' }}>
                        {/* Header */}
                        {showCertificateId && (
                            <div style={{ 
                                display: 'flex', 
                                justifyContent: 'space-between', 
                                alignItems: 'center',
                                marginBottom: '30px'
                            }}>
                                <div style={{ fontSize: '12px', color: '#666' }}>
                                    <strong>Certificate ID:</strong> {certificateId}
                                </div>
                            </div>
                        )}

                        {/* Site Name */}
                        <div style={{ 
                            textAlign: 'center',
                            marginBottom: '20px'
                        }}>
                            <h1 style={{
                                fontSize: '32px',
                                fontWeight: 'bold',
                                color: primaryColor,
                                margin: '0',
                                textTransform: 'uppercase',
                                letterSpacing: '2px'
                            }}>
                                {siteName}
                            </h1>
                            <p style={{ 
                                fontSize: '14px', 
                                color: '#666',
                                margin: '5px 0 0 0'
                            }}>
                                {tagline}
                            </p>
                        </div>

                        {/* Certificate Title */}
                        <div style={{ 
                            textAlign: 'center',
                            marginBottom: '30px',
                            marginTop: '30px'
                        }}>
                            <h2 style={{
                                fontSize: `${titleFontSize}px`,
                                fontWeight: 'bold',
                                color: secondaryColor,
                                margin: '0',
                                textTransform: 'uppercase',
                                letterSpacing: '4px'
                            }}>
                                CERTIFICATE
                            </h2>
                            <div style={{
                                width: '200px',
                                height: '3px',
                                background: primaryColor,
                                margin: '15px auto'
                            }} />
                            <p style={{ 
                                fontSize: '18px', 
                                color: '#666',
                                margin: '10px 0 0 0',
                                fontStyle: 'italic'
                            }}>
                                of Achievement
                            </p>
                        </div>

                        {/* Certificate Body */}
                        <div style={{ 
                            textAlign: 'center',
                            marginTop: '40px',
                            marginBottom: '40px'
                        }}>
                            <p style={{ 
                                fontSize: `${bodyFontSize}px`, 
                                color: '#333',
                                marginBottom: '20px'
                            }}>
                                This is to certify that
                            </p>
                            
                            <h3 style={{
                                fontSize: `${nameFontSize}px`,
                                fontWeight: 'bold',
                                color: '#000',
                                margin: '20px 0',
                                fontFamily: fontFamily,
                                fontStyle: 'italic',
                                borderBottom: `2px solid ${primaryColor}`,
                                paddingBottom: '10px',
                                display: 'inline-block'
                            }}>
                                {user?.name || 'Student Name'}
                            </h3>

                            <p style={{ 
                                fontSize: `${bodyFontSize}px`, 
                                color: '#333',
                                margin: '30px 60px',
                                lineHeight: '1.8'
                            }}>
                                has successfully completed the examination titled<br/>
                                <strong style={{ 
                                    fontSize: `${bodyFontSize + 4}px`, 
                                    color: primaryColor 
                                }}>
                                    "{exam?.name || 'Exam Name'}"
                                </strong><br/>
                                and achieved a score of<br/>
                                <strong style={{ 
                                    fontSize: `${bodyFontSize + 10}px`, 
                                    color: secondaryColor 
                                }}>
                                    {attempt?.score?.toFixed(2) || '0.00'}%
                                </strong>
                            </p>

                            {showDate && (
                                <p style={{ 
                                    fontSize: '16px', 
                                    color: '#666',
                                    marginTop: '30px'
                                }}>
                                    Awarded on <strong>{certificateDate}</strong>
                                </p>
                            )}
                        </div>

                        {/* Footer Signatures */}
                        <div style={{
                            position: 'absolute',
                            bottom: '0',
                            left: '0',
                            right: '0',
                            display: 'flex',
                            justifyContent: 'space-around',
                            paddingTop: '20px',
                            borderTop: `2px solid ${primaryColor}`
                        }}>
                            <div style={{ textAlign: 'center', flex: 1 }}>
                                <div style={{
                                    borderTop: '2px solid #333',
                                    width: '200px',
                                    margin: '0 auto 10px'
                                }} />
                                <p style={{ 
                                    margin: '0', 
                                    fontSize: '14px', 
                                    fontWeight: 'bold',
                                    color: '#333'
                                }}>
                                    {signatureTitle1}
                                </p>
                                {signatureSubtitle1 && (
                                    <p style={{ 
                                        margin: '0', 
                                        fontSize: '12px',
                                        color: '#666'
                                    }}>
                                        {signatureSubtitle1}
                                    </p>
                                )}
                            </div>

                            {showSeal && (
                                <div style={{ textAlign: 'center', flex: 1 }}>
                                    <div style={{
                                        width: '80px',
                                        height: '80px',
                                        border: `3px solid ${primaryColor}`,
                                        borderRadius: '50%',
                                        margin: '0 auto 10px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        background: 'white'
                                    }}>
                                        <div style={{
                                            fontSize: '12px',
                                            fontWeight: 'bold',
                                            color: primaryColor,
                                            textAlign: 'center'
                                        }}>
                                            {sealText.split(' ').map((word, i) => (
                                                <React.Fragment key={i}>
                                                    {word}{i < sealText.split(' ').length - 1 && <br/>}
                                                </React.Fragment>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div style={{ textAlign: 'center', flex: 1 }}>
                                <div style={{
                                    borderTop: '2px solid #333',
                                    width: '200px',
                                    margin: '0 auto 10px'
                                }} />
                                <p style={{ 
                                    margin: '0', 
                                    fontSize: '14px', 
                                    fontWeight: 'bold',
                                    color: '#333'
                                }}>
                                    {signatureTitle2}
                                </p>
                                <p style={{ 
                                    margin: '0', 
                                    fontSize: '12px',
                                    color: '#666'
                                }}>
                                    {signatureSubtitle2}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CertificateGenerator;
