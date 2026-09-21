'use client';
import React, { useState, useEffect, useRef } from 'react';
import { FiUpload, FiCheckCircle, FiClock, FiXCircle, FiDownload, FiEdit } from 'react-icons/fi';
import { toast } from 'react-toastify';

// Public, no-login digital consent form — mirrors the Flutter mobile app's
// E-Sign screen (mobile/lib/screens/student/esign/esign_screen.dart) field
// for field, section for section, so someone without the app (e.g. an iOS
// user who doesn't want to install it) gets exactly the same flow. Submits
// to /api/public/esign/* (no auth) instead of the app's /api/student/esign/*
// (JWT-authenticated) routes; the admin reviews these under Public E-Sign.
//
// There is no login here, so "my submission" is tracked by a random
// access token issued once at submit time and kept in this browser's
// localStorage — the same role a session cookie would play.

const STORAGE_KEY = 'public_esign_submission';

const ALL_PACKAGES = [
    'Coaching / ONLINE APK',
    'Eligibility Check',
    'DataFlow / PSV Support',
    'Exam Booking Support',
    'Full Package (Complete Process)'
];

const ALL_SERVICES = [
    'Coaching (Online)',
    'Eligibility / Assessment Support',
    'Exam Booking Support',
    'DataFlow / PSV Support',
    'Document Checklist & Verification Support',
    'Document Attestation Guidance',
    'Visa Guidance / Process Support',
    'Travel Guidance (Air Ticket / Airport Pickup)',
    'Job Support / Guidance (No Guarantee)',
    'CV Making & Interview Preparation'
];

const ALL_PAYMENT_SERVICES = [
    'Coaching (Online) – Fees as per selected plan',
    'Eligibility / Assessment – Fees as per process',
    'Exam Booking Support – Service fee + Authority portal fees separate',
    'DataFlow / PSV Support – Service fee + Authority portal fees separate',
    'Document Verification Support – Service fee applicable',
    'Document Attestation Guidance – Service fee applicable',
    'Visa Guidance / Support – Consultancy fee applicable',
    'Travel Guidance – Charges as per actuals (Ticket/Hotel etc.)',
    'Job Support / Guidance – Consultancy fee applicable (No guarantee)',
    'CV + Interview Preparation – Service fee applicable',
];

const ALL_PAYMENT_METHODS = [
    'Payment Screenshot (If available)',
    'Bank UTR / Transaction ID (If available)',
    'WhatsApp Confirmation Accepted',
    'Cash Payment (Receipt may not be available)'
];

const GULF_COURSES = [
    'DHA (Dubai Health Authority) – Dubai',
    'DOH / HAAD (Abu Dhabi License)',
    'MOH / MOH (Sharjah + UAE Other)',
    'OMSB (Oman License)',
    'QCHP (Qatar License)',
    'SCFHS / SMLE (Saudi License)',
    'KMLE (Kuwait License)',
    'NHRA (Bahrain License)'
];

const TERM_POINTS = [
    ['1. Voluntary Service Confirmation', 'I confirm that I am availing services by my own free will without any pressure, coercion, fraud, or misrepresentation.'],
    ['2. Document Authenticity Declaration', 'I declare that all documents and information submitted by me are true, genuine, authentic, and legally valid. If any document is found fake, forged, altered, fabricated, or misleading, I shall be solely responsible for all civil and criminal liabilities.'],
    ['3. Service Scope Limitation', 'MD Consultancy provides professional guidance, coaching, documentation support, and process assistance only. MD Consultancy does NOT guarantee PASS, JOB, VISA, LICENSE approval, or employment.'],
    ['4. No Employment Agency Clause', 'MD Consultancy is NOT a recruitment agency and does not guarantee job placement, salary, offer letter, or employment contract.'],
    ['5. Authority Decision Clause', 'All approvals and decisions (including but not limited to DHA / DOH / MOH / Prometric / DataFlow / PSV / Embassy / Immigration authorities) are controlled by respective official authorities. Authority decisions are final and binding.'],
    ['6. Performance Responsibility Clause', 'Exam results, eligibility approval, verification outcomes, interview performance, and licensing decisions depend entirely upon my qualifications and authority verification.'],
    ['7. Rule Change Protection Clause', 'If any authority changes rules, fees, eligibility criteria, or procedures at any stage, I agree to comply with updated rules. MD Consultancy shall not be responsible for such changes.'],
    ['8. Delay & Rejection Clause', 'Any delay or rejection due to: Authority timelines, Rule changes, Incomplete / incorrect documents, Technical portal errors, Third-party verification, Eligibility issues — shall not be the responsibility of MD Consultancy.'],
    ['9. Third-Party Charges Clause', 'All third-party charges (exam fees, embassy fees, authority portal fees, DataFlow fees, visa fees, air tickets, courier charges, etc.) are separate and strictly non-refundable.'],
    ['10. Service Fee & Refund Policy (STRICT)', 'Service fees are charged for professional work performed. Once any process has started (Eligibility, DataFlow, Exam Booking, Documentation, Coaching, Visa Process, etc.), service fees are strictly non-refundable under any circumstances. Cancellation after process initiation shall not be eligible for refund.'],
    ['11. Instalment Default Clause', 'If any payment milestone is delayed, MD Consultancy reserves the right to pause or terminate services without liability.'],
    ['12. Payment Proof Clause', 'All payments must be supported by valid proof (UTR / Transaction ID / Screenshot / Receipt). Without valid proof, MD Consultancy shall not be liable for payment disputes.'],
    ['13. Cash Payment Protection Clause', 'In case of cash payment without official receipt, the client shall not raise any future payment dispute.'],
    ['14. Chargeback & False Complaint Protection', 'I agree not to raise false chargebacks, payment reversals, or baseless complaints after service initiation. Legal recovery action may be initiated in such cases.'],
    ['15. Criminal Liability Clause', 'MD Consultancy does NOT create, alter, manipulate, or fabricate any government document. Any legal issue arising from submitted documents shall be solely my responsibility.'],
    ['16. Indemnity Clause', 'I agree to indemnify and hold harmless MD Consultancy from any legal claims, penalties, damages, losses, or liabilities arising due to: Fake documents, False information, Authority rejection, Third-party actions.'],
    ['17. Misconduct Clause', 'Use of abusive language, threats, harassment, or defamation against MD Consultancy or its staff will result in immediate termination of services without refund.'],
    ['18. Defamation Protection Clause', 'False allegations, social media defamation, or reputational damage attempts may result in strict legal action.'],
    ['19. Digital Communication Validity', 'WhatsApp chats, emails, SMS, call recordings, and digital payment confirmations shall be treated as valid legal proof of consent and agreement.'],
    ['20. Recording Consent Clause', 'I consent that calls may be recorded for quality control and legal protection purposes.'],
    ['21. Data Privacy & Authorization', 'I authorize MD Consultancy to: Submit my documents for official processing, Share data with relevant authorities, Use information strictly for processing purposes. All documents will be kept confidential and shared only when required for official processing.'],
    ['22. Legal Notice Requirement Clause', 'Before filing any legal complaint or police case, I agree to send a written legal notice and allow 15 working days for resolution.'],
    ['23. Force Majeure Clause', 'MD Consultancy shall not be responsible for delays caused by: Natural disasters, Government restrictions, Portal/server issues, Strikes, Pandemic, Unforeseen circumstances.'],
    ['24. Jurisdiction Clause', 'Any dispute shall be subject to Bhavnagar, Gujarat jurisdiction only.'],
];

function toDDMMYYYY(isoDate) {
    if (!isoDate) return '';
    const [y, m, d] = isoDate.split('-');
    if (!y || !m || !d) return '';
    return `${d}/${m}/${y}`;
}

function UploadBox({ label, file, onChange, capture }) {
    const inputRef = useRef(null);
    const previewUrl = file ? URL.createObjectURL(file) : null;

    return (
        <div className="mb-3">
            <label className="form-label small fw-bold text-muted text-uppercase">{label}</label>
            <div
                className="border rounded d-flex align-items-center justify-content-center"
                style={{ height: 120, cursor: 'pointer', overflow: 'hidden', background: '#f8f9fa' }}
                onClick={() => inputRef.current?.click()}
            >
                {previewUrl ? (
                    <img src={previewUrl} alt={label} style={{ maxHeight: '100%', maxWidth: '100%' }} />
                ) : (
                    <div className="text-center text-muted">
                        <FiUpload size={24} />
                        <div className="small mt-1">Tap to upload</div>
                    </div>
                )}
            </div>
            <input
                ref={inputRef}
                type="file"
                accept="image/*"
                capture={capture}
                hidden
                onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (!f) return;
                    if (f.size > 5 * 1024 * 1024) {
                        toast.error('Image must be less than 5MB');
                        return;
                    }
                    onChange(f);
                }}
            />
        </div>
    );
}

export default function PublicESignPage() {
    const [phase, setPhase] = useState('loading'); // loading | form | submitted
    const [submitting, setSubmitting] = useState(false);
    const [statusData, setStatusData] = useState(null);

    // Personal details
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [mobile, setMobile] = useState('');
    const [dob, setDob] = useState('');
    const [nationality, setNationality] = useState('');
    const [currentAddress, setCurrentAddress] = useState('');
    const [passportNumber, setPassportNumber] = useState('');
    const [education, setEducation] = useState('');
    const [workExperience, setWorkExperience] = useState('');
    const [rollNumber, setRollNumber] = useState('');

    // Documents
    const [passportFront, setPassportFront] = useState(null);
    const [passportBack, setPassportBack] = useState(null);
    const [passportPhoto, setPassportPhoto] = useState(null);
    const [selfiePhoto, setSelfiePhoto] = useState(null);
    const [signatureImage, setSignatureImage] = useState(null);

    // Selections
    const [gulfCourse, setGulfCourse] = useState('');
    const [packages, setPackages] = useState(new Set(ALL_PACKAGES));
    const [services, setServices] = useState(new Set(ALL_SERVICES));
    const [otherService, setOtherService] = useState('');
    const [paymentServices, setPaymentServices] = useState(new Set(ALL_PAYMENT_SERVICES));
    const [otherPayment, setOtherPayment] = useState('');
    const [paymentMethods, setPaymentMethods] = useState(new Set(ALL_PAYMENT_METHODS));

    const [noAdvance, setNoAdvance] = useState(true);
    const [payAsPerWork, setPayAsPerWork] = useState(true);
    const [declarationAccepted, setDeclarationAccepted] = useState(true);
    const [finalReadAll, setFinalReadAll] = useState(true);
    const [finalAuthorize, setFinalAuthorize] = useState(true);
    const [ackNoAdvance, setAckNoAdvance] = useState(true);
    const [ackProceed, setAckProceed] = useState(true);

    // Signature block
    const [signatureName, setSignatureName] = useState('');
    const [signDate, setSignDate] = useState('');
    const [signPlace, setSignPlace] = useState('');

    useEffect(() => {
        checkExistingSubmission();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const checkExistingSubmission = async () => {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (!raw) {
                setPhase('form');
                return;
            }
            const { submissionId, accessToken } = JSON.parse(raw);
            const res = await fetch(`/api/public/esign/status?submissionId=${submissionId}&token=${accessToken}`);
            const data = await res.json();
            if (data.success && data.submitted) {
                setStatusData({ ...data, submissionId, accessToken });
                setPhase('submitted');
            } else {
                localStorage.removeItem(STORAGE_KEY);
                setPhase('form');
            }
        } catch (e) {
            setPhase('form');
        }
    };

    const toggleInSet = (setFn, set, item) => {
        const next = new Set(set);
        if (next.has(item)) next.delete(item);
        else next.add(item);
        setFn(next);
    };

    const uploadFile = async (file) => {
        const formData = new FormData();
        formData.append('file', file);
        const res = await fetch('/api/public/esign/upload', { method: 'POST', body: formData });
        const data = await res.json();
        if (!data.success) throw new Error(data.message || 'Upload failed');
        return data.url;
    };

    const validate = () => {
        // Presence + format checks. The old version only checked "is it
        // empty" — a malformed email or a 3-digit "mobile number" passed
        // straight through to the backend and into the PDF/admin panel.
        if (!fullName.trim()) {
            toast.error('Please enter your Full Name');
            return false;
        }
        if (fullName.trim().length < 3) {
            toast.error('Full Name looks too short — please enter your full name');
            return false;
        }
        if (!email.trim()) {
            toast.error('Please enter your Email ID');
            return false;
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
            toast.error('Please enter a valid Email ID');
            return false;
        }
        if (!mobile.trim()) {
            toast.error('Please enter your Mobile number');
            return false;
        }
        if (!/^[0-9]{10}$/.test(mobile.trim())) {
            toast.error('Mobile number must be exactly 10 digits');
            return false;
        }
        if (!passportFront || !passportBack || !passportPhoto || !selfiePhoto) {
            toast.error('Please upload Passport Front, Passport Back, Passport Photo and Selfie');
            return false;
        }
        if (!signatureImage) {
            toast.error('Please upload your e-Sign');
            return false;
        }
        if (!gulfCourse) {
            toast.error('Please select a Gulf License Course / Exam');
            return false;
        }
        if (!noAdvance || !payAsPerWork) {
            toast.error('Please accept Service-Wise Payment Terms');
            return false;
        }
        if (!declarationAccepted) {
            toast.error('Please agree to the 24 Terms & Conditions');
            return false;
        }
        if (!finalReadAll || !finalAuthorize) {
            toast.error('Please accept Final Confirmation');
            return false;
        }
        if (!ackNoAdvance || !ackProceed) {
            toast.error('Please acknowledge Payment Authorization');
            return false;
        }
        if (!signDate) {
            toast.error('Please select the signing date');
            return false;
        }
        if (!signatureName) {
            toast.error('Please enter your full name for the signature');
            return false;
        }
        return true;
    };

    const handleSubmit = async () => {
        if (!validate()) return;
        setSubmitting(true);
        try {
            const [passportFrontUrl, passportBackUrl, passportPhotoUrl, selfiePhotoUrl, signatureImageUrl] = await Promise.all([
                uploadFile(passportFront),
                uploadFile(passportBack),
                uploadFile(passportPhoto),
                uploadFile(selfiePhoto),
                uploadFile(signatureImage),
            ]);

            const payload = {
                personalDetails: {
                    fullName, email, mobile, dob, nationality, currentAddress,
                    passportNumber, education, workExperience, rollNumber
                },
                selections: {
                    gulfLicenseCourse: gulfCourse,
                    coursePackageType: Array.from(packages),
                    servicesSelected: Array.from(services),
                    otherService,
                    paymentTerms: { noAdvanceAccepted: noAdvance, payAsWorkAccepted: payAsPerWork },
                    confirmedPaymentServices: Array.from(paymentServices),
                    otherPayment,
                    paymentMethods: Array.from(paymentMethods),
                    declarations: {
                        declarationAccepted,
                        digitalConsent: { confirmed: true, validTreat: true },
                        dataPrivacy: { collectionAuth: true, shareAuth: true },
                        refundPolicy: { startedNonRefundable: true, cancelNoRefund: true, thirdPartyNonRefundable: true },
                        thirdPartyDisclaimer: { govtDecision: true, consultancyLiability: true },
                        finalConfirmation: { readAll: finalReadAll, authorizeStart: finalAuthorize }
                    }
                },
                signature: { clientName: signatureName, date: toDDMMYYYY(signDate), place: signPlace },
                documents: {
                    passportFront: passportFrontUrl,
                    passportBack: passportBackUrl,
                    passportPhoto: passportPhotoUrl,
                    selfiePhoto: selfiePhotoUrl,
                    signatureImage: signatureImageUrl
                }
            };

            const res = await fetch('/api/public/esign/submit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const data = await res.json();

            if (data.success) {
                localStorage.setItem(STORAGE_KEY, JSON.stringify({
                    submissionId: data.submissionId,
                    accessToken: data.accessToken
                }));
                toast.success('E-Sign Submitted Successfully!');
                checkExistingSubmission();
            } else {
                toast.error(data.message || 'Submission failed');
            }
        } catch (e) {
            toast.error(e.message || 'Submission failed');
        } finally {
            setSubmitting(false);
        }
    };

    const handleRefill = () => {
        localStorage.removeItem(STORAGE_KEY);
        setPhase('form');
    };

    if (phase === 'loading') {
        return (
            <div className="d-flex align-items-center justify-content-center" style={{ minHeight: '100vh' }}>
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                </div>
            </div>
        );
    }

    if (phase === 'submitted') {
        const isApproved = statusData?.status === 'Approved';
        const isRejected = statusData?.status === 'Rejected';
        return (
            <div className="container py-5" style={{ maxWidth: 560 }}>
                <div className="card border-0 shadow-sm text-center p-5">
                    {isApproved ? (
                        <FiCheckCircle size={64} className="text-success mx-auto mb-3" />
                    ) : isRejected ? (
                        <FiXCircle size={64} className="text-danger mx-auto mb-3" />
                    ) : (
                        <FiClock size={64} className="text-warning mx-auto mb-3" />
                    )}
                    <h4 className="fw-bold mb-2">
                        {isApproved ? 'Form Approved!' : isRejected ? 'Form Rejected' : 'Submission In Progress'}
                    </h4>
                    <p className="text-muted">
                        {isApproved
                            ? 'Your E-Sign form has been approved by MD Consultancy. You can now download the signed copy.'
                            : isRejected
                                ? 'Your application was rejected. Please check your details and fill the form again.'
                                : 'Your form has been submitted and is currently under review. Please wait for approval.'}
                    </p>

                    {isApproved && (
                        <a
                            href={`/api/public/esign/pdf?submissionId=${statusData.submissionId}&token=${statusData.accessToken}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-success mt-3 d-inline-flex align-items-center gap-2"
                        >
                            <FiDownload /> Download Signed PDF
                        </a>
                    )}

                    {isRejected && (
                        <button className="btn btn-primary mt-3 d-inline-flex align-items-center gap-2 mx-auto" onClick={handleRefill}>
                            <FiEdit /> Re-fill Form
                        </button>
                    )}

                    {!isApproved && !isRejected && (
                        <div className="alert alert-warning mt-3 mb-0 d-inline-flex align-items-center gap-2">
                            <FiClock /> Status: Pending Approval
                        </div>
                    )}

                    <hr className="my-4" />
                    <p className="small text-muted mb-0">
                        Contact us for urgent queries:<br />+91 9081505454 · info@mdconsultancy.in
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-light" style={{ minHeight: '100vh' }}>
            <div className="container py-4" style={{ maxWidth: 720 }}>
                <div className="card border-0 shadow-sm">
                    <div className="card-header bg-primary text-white text-center py-3">
                        <h5 className="mb-0">Digital Consent Form</h5>
                    </div>
                    <div className="card-body p-4">
                        <h6 className="fw-bold text-uppercase text-secondary mb-3">Client Details</h6>
                        <div className="mb-3">
                            <label className="form-label small fw-bold text-muted text-uppercase">Full Name (As per Passport) <span className="text-danger">*</span></label>
                            <input className="form-control" value={fullName} onChange={(e) => setFullName(e.target.value)} />
                        </div>
                        <div className="mb-3">
                            <label className="form-label small fw-bold text-muted text-uppercase">Mobile / WhatsApp <span className="text-danger">*</span></label>
                            <input className="form-control" type="tel" maxLength={15} value={mobile} onChange={(e) => setMobile(e.target.value.replace(/\D/g, ''))} />
                        </div>
                        <div className="mb-3">
                            <label className="form-label small fw-bold text-muted text-uppercase">Email ID <span className="text-danger">*</span></label>
                            <input className="form-control" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                        </div>
                        <div className="mb-3">
                            <label className="form-label small fw-bold text-muted text-uppercase">Date of Birth</label>
                            <input className="form-control" type="date" value={dob} onChange={(e) => setDob(e.target.value)} />
                        </div>
                        <div className="mb-3">
                            <label className="form-label small fw-bold text-muted text-uppercase">Nationality</label>
                            <input className="form-control" value={nationality} onChange={(e) => setNationality(e.target.value)} />
                        </div>
                        <div className="mb-3">
                            <label className="form-label small fw-bold text-muted text-uppercase">Current Address</label>
                            <textarea className="form-control" rows={3} value={currentAddress} onChange={(e) => setCurrentAddress(e.target.value)} />
                        </div>
                        <div className="mb-3">
                            <label className="form-label small fw-bold text-muted text-uppercase">Passport Number</label>
                            <input className="form-control" value={passportNumber} onChange={(e) => setPassportNumber(e.target.value)} />
                        </div>
                        <div className="mb-3">
                            <label className="form-label small fw-bold text-muted text-uppercase">Education / Profession</label>
                            <input className="form-control" value={education} onChange={(e) => setEducation(e.target.value)} />
                        </div>
                        <div className="mb-3">
                            <label className="form-label small fw-bold text-muted text-uppercase">Work Experience (Years)</label>
                            <input className="form-control" type="number" min="0" value={workExperience} onChange={(e) => setWorkExperience(e.target.value)} />
                        </div>
                        <div className="mb-4">
                            <label className="form-label small fw-bold text-muted text-uppercase">Roll Number (if applicable)</label>
                            <input className="form-control" value={rollNumber} onChange={(e) => setRollNumber(e.target.value)} />
                        </div>

                        <hr />
                        <h6 className="fw-bold text-uppercase text-secondary mb-1">Document Upload</h6>
                        <p className="small fst-italic text-muted">Please upload clear photos/scans in the boxes below:</p>
                        <UploadBox label="1. Passport Front Page" file={passportFront} onChange={setPassportFront} />
                        <UploadBox label="2. Passport Back Page" file={passportBack} onChange={setPassportBack} />
                        <UploadBox label="3. Passport Size Photo" file={passportPhoto} onChange={setPassportPhoto} />
                        <UploadBox label="4. Selfie Photo" file={selfiePhoto} onChange={setSelfiePhoto} capture="user" />

                        <hr />
                        <h6 className="fw-bold text-uppercase text-secondary mb-3">Gulf Specialized Courses / Exams</h6>
                        {GULF_COURSES.map((c) => (
                            <div className="form-check mb-2" key={c}>
                                <input
                                    className="form-check-input"
                                    type="radio"
                                    name="gulfCourse"
                                    id={`gulf-${c}`}
                                    checked={gulfCourse === c}
                                    onChange={() => setGulfCourse(c)}
                                />
                                <label className="form-check-label small" htmlFor={`gulf-${c}`}>{c}</label>
                            </div>
                        ))}

                        <hr />
                        <h6 className="fw-bold text-uppercase text-secondary mb-3">Selected Package Category</h6>
                        {ALL_PACKAGES.map((pkg) => (
                            <div className="form-check mb-2" key={pkg}>
                                <input
                                    className="form-check-input"
                                    type="checkbox"
                                    id={`pkg-${pkg}`}
                                    checked={packages.has(pkg)}
                                    onChange={() => toggleInSet(setPackages, packages, pkg)}
                                />
                                <label className="form-check-label small" htmlFor={`pkg-${pkg}`}>{pkg}</label>
                            </div>
                        ))}

                        <hr />
                        <h6 className="fw-bold text-uppercase text-secondary mb-3">Included Support Services</h6>
                        {ALL_SERVICES.map((sv) => (
                            <div className="form-check mb-2" key={sv}>
                                <input
                                    className="form-check-input"
                                    type="checkbox"
                                    id={`sv-${sv}`}
                                    checked={services.has(sv)}
                                    onChange={() => toggleInSet(setServices, services, sv)}
                                />
                                <label className="form-check-label small" htmlFor={`sv-${sv}`}>{sv}</label>
                            </div>
                        ))}

                        <hr />
                        <h6 className="fw-bold text-uppercase text-secondary mb-2">Payment Based on Selected Services</h6>
                        <p className="small">I confirm that my payment will be calculated service-wise as below:</p>
                        {ALL_PAYMENT_SERVICES.map((ps) => (
                            <div className="form-check mb-2" key={ps}>
                                <input
                                    className="form-check-input"
                                    type="checkbox"
                                    id={`ps-${ps}`}
                                    checked={paymentServices.has(ps)}
                                    onChange={() => toggleInSet(setPaymentServices, paymentServices, ps)}
                                />
                                <label className="form-check-label small" htmlFor={`ps-${ps}`}>{ps}</label>
                            </div>
                        ))}

                        <hr />
                        <h6 className="fw-bold text-uppercase text-secondary mb-3">Payment Confirmation Method (Receipt Not Mandatory)</h6>
                        {ALL_PAYMENT_METHODS.map((pm) => (
                            <div className="form-check mb-2" key={pm}>
                                <input
                                    className="form-check-input"
                                    type="checkbox"
                                    id={`pm-${pm}`}
                                    checked={paymentMethods.has(pm)}
                                    onChange={() => toggleInSet(setPaymentMethods, paymentMethods, pm)}
                                />
                                <label className="form-check-label small" htmlFor={`pm-${pm}`}>{pm}</label>
                            </div>
                        ))}

                        <hr />
                        <h6 className="fw-bold text-uppercase text-secondary mb-3">Service-Wise Payment Terms</h6>
                        <div className="form-check mb-2">
                            <input className="form-check-input" type="checkbox" id="noAdvance" checked={noAdvance} onChange={(e) => setNoAdvance(e.target.checked)} />
                            <label className="form-check-label small" htmlFor="noAdvance">I understand that MD Consultancy does NOT take advance payment.</label>
                        </div>
                        <div className="form-check mb-2">
                            <input className="form-check-input" type="checkbox" id="payAsPerWork" checked={payAsPerWork} onChange={(e) => setPayAsPerWork(e.target.checked)} />
                            <label className="form-check-label small" htmlFor="payAsPerWork">I will pay fees only for selected services and work started/completed.</label>
                        </div>

                        <div className="alert alert-secondary text-center fw-bold text-uppercase my-4">
                            Client Declaration &amp; Terms (Mandatory)
                        </div>
                        <div className="border rounded p-3 mb-3" style={{ background: '#fafafa' }}>
                            <p className="fw-bold">
                                I, <u>{fullName || '________________'}</u>, hereby confirm that I am voluntarily taking professional consultancy services from MD Consultancy.
                            </p>
                            <hr />
                            {TERM_POINTS.map(([title, content]) => (
                                <div key={title} className="mb-3">
                                    <div className="fw-bold small bg-secondary text-white d-inline-block px-2 py-1 mb-1">{title}</div>
                                    <p className="small mb-0">{content}</p>
                                </div>
                            ))}
                        </div>
                        <div className="form-check mb-4">
                            <input className="form-check-input" type="checkbox" id="declarationAccepted" checked={declarationAccepted} onChange={(e) => setDeclarationAccepted(e.target.checked)} />
                            <label className="form-check-label small fw-bold" htmlFor="declarationAccepted">I have read and agree to all 24 Terms &amp; Conditions mentioned above.</label>
                        </div>

                        <hr />
                        <h6 className="fw-bold text-uppercase text-secondary mb-2">Legal Disclaimer (India Compliance)</h6>
                        <p className="small text-muted">
                            MD Consultancy is a private consultancy and documentation support service provider. We are NOT a
                            government authority, NOT a visa issuing authority, and NOT affiliated with DHA / DOH / MOH / Prometric
                            / DataFlow / PSV authorities.<br /><br />
                            All approvals and decisions are subject to official authority rules and verification. We are not
                            responsible for rejection, delay, government rule changes, or technical portal issues.
                        </p>

                        <hr />
                        <h6 className="fw-bold text-uppercase text-secondary mb-3">Final Confirmation</h6>
                        <div className="form-check mb-2">
                            <input className="form-check-input" type="checkbox" id="finalReadAll" checked={finalReadAll} onChange={(e) => setFinalReadAll(e.target.checked)} />
                            <label className="form-check-label small" htmlFor="finalReadAll">I have read and understood all the above terms and conditions.</label>
                        </div>
                        <div className="form-check mb-2">
                            <input className="form-check-input" type="checkbox" id="finalAuthorize" checked={finalAuthorize} onChange={(e) => setFinalAuthorize(e.target.checked)} />
                            <label className="form-check-label small" htmlFor="finalAuthorize">I legally accept all clauses mentioned above.</label>
                        </div>

                        <hr />
                        <h6 className="fw-bold text-uppercase text-secondary mb-3">Payment Authorization</h6>
                        <div className="form-check mb-2">
                            <input className="form-check-input" type="checkbox" id="ackNoAdvance" checked={ackNoAdvance} onChange={(e) => setAckNoAdvance(e.target.checked)} />
                            <label className="form-check-label small" htmlFor="ackNoAdvance">I acknowledge that MD Consultancy does not accept any advance payment.</label>
                        </div>
                        <div className="form-check mb-3">
                            <input className="form-check-input" type="checkbox" id="ackProceed" checked={ackProceed} onChange={(e) => setAckProceed(e.target.checked)} />
                            <label className="form-check-label small" htmlFor="ackProceed">I agree to proceed with the services as per the discussed milestones.</label>
                        </div>
                        <div className="mb-4">
                            <label className="form-label small fw-bold text-muted text-uppercase">Payment Mode</label>
                            <input className="form-control" value="Selected by Consultant" readOnly />
                        </div>

                        <hr />
                        <h6 className="fw-bold text-uppercase text-secondary mb-3">Authorization &amp; Digital Acceptance (eSign)</h6>
                        <UploadBox label="Client Signature (eSign) - Max 5MB *" file={signatureImage} onChange={setSignatureImage} />
                        <div className="mb-3">
                            <label className="form-label small fw-bold text-muted text-uppercase">Client Full Name <span className="text-danger">*</span></label>
                            <input className="form-control" value={signatureName} onChange={(e) => setSignatureName(e.target.value)} />
                        </div>
                        <div className="mb-3">
                            <label className="form-label small fw-bold text-muted text-uppercase">Date <span className="text-danger">*</span></label>
                            <input className="form-control" type="date" value={signDate} onChange={(e) => setSignDate(e.target.value)} />
                        </div>
                        <div className="mb-4">
                            <label className="form-label small fw-bold text-muted text-uppercase">Place</label>
                            <input className="form-control" value={signPlace} onChange={(e) => setSignPlace(e.target.value)} />
                        </div>

                        <button
                            className="btn btn-primary w-100 py-2 fw-bold"
                            disabled={submitting}
                            onClick={handleSubmit}
                        >
                            {submitting ? 'Submitting…' : 'SUBMIT & SIGN FORM'}
                        </button>

                        <div className="text-center mt-4 pt-3 border-top">
                            <p className="fw-bold text-success mb-1">✅ MD Consultancy Approval Confirmed</p>
                            <p className="fw-bold text-success">✅ Digital Approval Valid</p>
                            <p className="small mb-0">Mobile / WhatsApp: +91 9081505454</p>
                            <p className="small mb-0">Email: info@mdconsultancy.in</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
