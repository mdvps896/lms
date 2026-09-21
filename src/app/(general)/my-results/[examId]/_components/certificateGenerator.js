import Swal from 'sweetalert2';

// Generates and downloads the exam completion certificate as a PDF for the given attempt.
// Kept as a standalone async helper (pure extraction from the page component) so it can be
// invoked with the exam/user/settings context passed in explicitly.
export const downloadCertificate = async ({ attempt, exam, user, settings }) => {
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
};
