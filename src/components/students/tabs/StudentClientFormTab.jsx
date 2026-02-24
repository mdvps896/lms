'use client'

import React, { useState, useEffect } from 'react'
import { FiDownload, FiFileText, FiAlertCircle, FiRefreshCw } from 'react-icons/fi'

const StudentClientFormTab = ({ studentId, studentName }) => {
    const [formData, setFormData] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [generating, setGenerating] = useState(false)

    useEffect(() => {
        if (studentId) fetchFormData()
    }, [studentId])

    const fetchFormData = async () => {
        setLoading(true)
        setError(null)
        try {
            const res = await fetch(`/api/admin/client-form?userId=${studentId}`)
            const data = await res.json()
            if (data.success) {
                setFormData(data.data.formData)
            } else {
                setError(data.message || 'No form data found')
            }
        } catch (err) {
            setError('Failed to connect to server')
        } finally {
            setLoading(false)
        }
    }

    const downloadPdf = async () => {
        if (!formData) return
        setGenerating(true)
        try {
            // Dynamically import jspdf to avoid SSR issues
            const { jsPDF } = await import('jspdf')
            const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })

            const d = formData
            const pageW = doc.internal.pageSize.getWidth()
            const margin = 14
            const contentW = pageW - margin * 2
            let y = 14

            // ── Helpers ──────────────────────────────
            const checkPage = (needed = 10) => {
                if (y + needed > 275) { doc.addPage(); y = 14 }
            }

            const drawHeader = () => {
                doc.setFontSize(18)
                doc.setFont('helvetica', 'bold')
                doc.setTextColor(10, 60, 140)
                doc.text('MD CONSULTANCY', pageW / 2, y, { align: 'center' })
                y += 6
                doc.setFontSize(9)
                doc.setFont('helvetica', 'normal')
                doc.setTextColor(100)
                doc.text('Specialist in Health Care Recruitment & Licensing', pageW / 2, y, { align: 'center' })
                y += 5
                doc.setDrawColor(200)
                doc.line(margin, y, pageW - margin, y)
                y += 6
            }

            const drawTitle = (title) => {
                checkPage(12)
                doc.setFillColor(22, 78, 153)
                doc.rect(margin, y, contentW, 8, 'F')
                doc.setFontSize(10)
                doc.setFont('helvetica', 'bold')
                doc.setTextColor(255, 255, 255)
                doc.text(title, margin + 3, y + 5.5)
                doc.setTextColor(0)
                y += 11
            }

            const drawSectionHeader = (title) => {
                checkPage(10)
                doc.setFillColor(235, 235, 235)
                doc.rect(margin, y, contentW, 7, 'F')
                doc.setFontSize(9)
                doc.setFont('helvetica', 'bold')
                doc.setTextColor(22, 78, 153)
                doc.text(title.toUpperCase(), margin + 2, y + 5)
                doc.setTextColor(0)
                y += 9
            }

            const drawRow = (label, value) => {
                const val = value != null && value !== '' ? String(value) : '-'
                const labelW = 55
                const valueW = contentW - labelW

                // Wrap value text
                doc.setFontSize(9)
                const lines = doc.splitTextToSize(val, valueW - 4)
                const rowH = Math.max(8, lines.length * 5 + 3)
                checkPage(rowH + 2)

                doc.setDrawColor(180)
                doc.setFillColor(248, 248, 248)
                doc.rect(margin, y, labelW, rowH, 'FD')
                doc.rect(margin + labelW, y, valueW, rowH, 'D')

                doc.setFont('helvetica', 'bold')
                doc.setFontSize(8.5)
                doc.setTextColor(50)
                doc.text(label, margin + 2, y + 5)

                doc.setFont('helvetica', 'normal')
                doc.setTextColor(0)
                doc.text(lines, margin + labelW + 2, y + 5)

                y += rowH
            }

            const drawCheckList = (allOptions, selected = []) => {
                const colW = contentW / 2
                allOptions.forEach((opt, idx) => {
                    const col = idx % 2
                    const row = Math.floor(idx / 2)
                    if (col === 0) checkPage(8)
                    const xPos = margin + col * colW
                    const yPos = col === 0 ? y : y - 7
                    const isChecked = Array.isArray(selected) && selected.includes(opt)

                    // Checkbox square
                    doc.setDrawColor(isChecked ? 34 : 200, isChecked ? 139 : 34, isChecked ? 34 : 34)
                    doc.setFillColor(isChecked ? 34 : 255, isChecked ? 139 : 255, isChecked ? 34 : 255)
                    doc.rect(xPos, yPos, 4, 4, 'FD')
                    if (isChecked) {
                        doc.setDrawColor(255, 255, 255)
                        doc.setLineWidth(0.6)
                        doc.line(xPos + 0.8, yPos + 2, xPos + 1.8, yPos + 3.2)
                        doc.line(xPos + 1.8, yPos + 3.2, xPos + 3.5, yPos + 0.8)
                        doc.setLineWidth(0.2)
                    }

                    doc.setFont('helvetica', 'normal')
                    doc.setFontSize(8)
                    doc.setTextColor(0)
                    doc.text(opt, xPos + 5.5, yPos + 3.2)

                    if (col === 1 || idx === allOptions.length - 1) y += 7
                })
            }

            const drawNotes = (label, notes) => {
                if (!notes || notes.trim() === '') return
                checkPage(16)
                doc.setFillColor(250, 250, 220)
                doc.setDrawColor(180)
                const lines = doc.splitTextToSize(notes, contentW - 8)
                const boxH = lines.length * 5 + 8
                doc.rect(margin, y, contentW, boxH, 'FD')
                doc.setFont('helvetica', 'bold')
                doc.setFontSize(8.5)
                doc.setTextColor(80, 80, 0)
                doc.text(label + ':', margin + 2, y + 5)
                doc.setFont('helvetica', 'normal')
                doc.setTextColor(0)
                doc.text(lines, margin + 2, y + 10)
                y += boxH + 3
            }

            const drawFooter = () => {
                const pageH = doc.internal.pageSize.getHeight()
                doc.setDrawColor(180)
                doc.line(margin, pageH - 18, pageW - margin, pageH - 18)
                doc.setFontSize(7.5)
                doc.setFont('helvetica', 'italic')
                doc.setTextColor(100)
                doc.text('Note: This is a system-generated document based on client submission.', margin, pageH - 13)
                doc.text('+91 9081505454 | mdconsultancy896@gmail.com', margin, pageH - 8)
            }

            // ── BUILD DOCUMENT ──────────────────────
            drawHeader()
            drawTitle('Client Information & Service Form')
            y += 4

            // 1. Personal Details
            drawSectionHeader('1. Personal Identification Details')
            drawRow('First Name', d.firstName)
            drawRow('Middle Name', d.middleName)
            drawRow('Surname', d.surname)
            drawRow('Full Name', d.fullName)
            drawRow('Gender', d.gender)
            drawRow('Date of Birth', d.dob)
            drawRow('Age', d.age)
            drawRow('Nationality', d.nationality)
            drawRow('Marital Status', d.maritalStatus)
            y += 3

            // 2. Contact
            drawSectionHeader('2. Contact Details')
            drawRow('Primary Mobile', d.primaryPhone)
            drawRow('Alternate Mobile', d.alternatePhone)
            drawRow('Email ID', d.email)
            drawRow('Current Address', d.currentAddress)
            drawRow('Permanent Address', d.permanentAddress)
            y += 3

            // 3. Passport
            drawSectionHeader('3. Passport Details')
            drawRow('Passport Number', d.passportNo)
            drawRow('Place of Issue', d.passportPlace)
            drawRow('Date of Issue', d.passportIssueDate)
            drawRow('Date of Expiry', d.passportExpiryDate)
            drawRow('Previous Passport', d.hasPreviousPassport ? 'Yes' : 'No')
            y += 3

            // 4. Professional
            drawSectionHeader('4. Professional & Education Category')
            drawRow('Qualification Category', d.qualificationCategory)
            if (d.qualificationSub) {
                const parts = d.qualificationSub.split('|')
                if (parts[0]) drawRow('Qualification', parts[0].trim())
                if (parts[1]) drawRow('Specialty', parts[1].trim())
                if (parts[2]) drawRow('Other Details', parts[2].trim())
            }
            if (d.specialty) drawRow('Other Specialty', d.specialty)
            drawNotes('Notes', d.profNotes)
            y += 3

            // 5. Educational
            drawSectionHeader('5. Educational Details')
            drawRow('University Name', d.univName)
            drawRow('Country of Study', d.studyCountry)
            drawRow('Admission Year', d.admissionYear)
            drawRow('Passing Year', d.passingYear)
            drawRow('Internship Date', d.internshipDate)
            drawNotes('Notes', d.eduNotes)
            y += 3

            // 6. Registration
            drawSectionHeader('6. Professional Registration Details')
            drawRow('Council Name', d.councilName)
            drawRow('Reg. Number', d.regNo)
            drawRow('Valid Till', d.regValidTill)
            drawRow('Renewal Date', d.regRenewalDate)
            if (d.otherCert) drawRow('Other Certificate', d.otherCert)
            drawRow('Notes', d.regNotes)
            y += 3

            // 7. Work Experience
            drawSectionHeader('7. Work Experience Details')
            drawRow('Hospital/Clinic', d.hospitalName)
            drawRow('Position', d.position)
            drawRow('Department', d.department)
            drawRow('City', d.city)
            drawRow('Period', `${d.expFrom || '-'} to ${d.expTo || '-'}`)
            drawRow('Total Experience', d.totalExperience)
            drawRow('Notes', d.expNotes)
            y += 3

            // 8. Gulf Licensing
            drawSectionHeader('8. Gulf Licensing / Exam Details')
            if (d.licensingExams) {
                Object.entries(d.licensingExams).forEach(([country, exams]) => {
                    if (Array.isArray(exams) && exams.length > 0) {
                        drawRow(country, exams.join(', '))
                    }
                })
            } else {
                drawRow('Licensing Details', 'No exams selected')
            }
            drawNotes('Notes', d.gulfNotes)
            y += 3

            // 9. Document Checklist
            checkPage(20)
            drawSectionHeader('9. Document Submission Checklist')
            const allDocs = [
                '10th Marksheet', '12th Marksheet', '12th Credit Certificate',
                'School Leaving Certificate', 'Passport Copy',
                'Passport Size Photo (White Background)', 'Degree Certificate',
                'All Semester Mark Sheets', 'Internship Certificate',
                'Registration Certificate', 'Council Certificate',
                'Good Standing Certificate', 'Experience Certificate',
                'Updated CV', 'Renewal Certificate', 'BLS / ACLS Certificate',
            ]
            drawCheckList(allDocs, d.documentChecklist || [])
            y += 3
            drawNotes('Notes', d.docNotes)

            // Footer on all pages
            const totalPages = doc.internal.getNumberOfPages()
            for (let i = 1; i <= totalPages; i++) {
                doc.setPage(i)
                drawFooter()
                doc.setFontSize(7.5)
                doc.setFont('helvetica', 'normal')
                doc.setTextColor(150)
                doc.text(`Page ${i} of ${totalPages}`, pageW - margin, doc.internal.pageSize.getHeight() - 8, { align: 'right' })
            }

            doc.save(`Client_Form_${(studentName || 'Student').replace(/\s+/g, '_')}.pdf`)
        } catch (err) {
            console.error('PDF generation error:', err)
            alert('Failed to generate PDF. Please try again.')
        } finally {
            setGenerating(false)
        }
    }

    // ── Row display helper ──
    const InfoRow = ({ label, value }) => {
        if (!value || value === '') return null
        return (
            <tr>
                <td className="fw-semibold text-muted small py-1 pe-3" style={{ width: '40%', whiteSpace: 'nowrap' }}>{label}</td>
                <td className="small py-1">{String(value)}</td>
            </tr>
        )
    }

    const Section = ({ title, children }) => (
        <div className="mb-4">
            <div className="px-3 py-2 rounded-top" style={{ background: '#1a4fa0', color: 'white', fontWeight: 600, fontSize: '0.85rem' }}>
                {title}
            </div>
            <div className="border border-top-0 rounded-bottom p-3" style={{ background: '#fff' }}>
                <table className="table table-sm table-borderless mb-0 w-100">
                    <tbody>{children}</tbody>
                </table>
            </div>
        </div>
    )

    if (loading) return (
        <div className="d-flex justify-content-center align-items-center p-5">
            <div className="spinner-border text-primary" />
        </div>
    )

    if (error) return (
        <div className="text-center p-5">
            <FiAlertCircle className="display-4 text-warning mb-3" />
            <p className="text-muted mb-3">{error}</p>
            <button className="btn btn-sm btn-outline-primary" onClick={fetchFormData}>
                <FiRefreshCw className="me-1" /> Retry
            </button>
        </div>
    )

    const d = formData || {}

    return (
        <div>
            {/* Top bar */}
            <div className="d-flex justify-content-between align-items-center mb-4 p-3 rounded" style={{ background: '#f0f4ff', border: '1px solid #c7d7f9' }}>
                <div className="d-flex align-items-center gap-2">
                    <FiFileText className="text-primary" size={20} />
                    <div>
                        <div className="fw-bold">Client Information & Service Form</div>
                        <div className="text-muted small">Submitted by student — read-only view</div>
                    </div>
                </div>
                <button
                    className="btn btn-primary d-flex align-items-center gap-2"
                    onClick={downloadPdf}
                    disabled={generating}
                >
                    {generating ? (
                        <><span className="spinner-border spinner-border-sm" />Generating...</>
                    ) : (
                        <><FiDownload />Download PDF</>
                    )}
                </button>
            </div>

            {/* 1. Personal */}
            <Section title="1. Personal Identification Details">
                <InfoRow label="First Name" value={d.firstName} />
                <InfoRow label="Middle Name" value={d.middleName} />
                <InfoRow label="Surname" value={d.surname} />
                <InfoRow label="Full Name" value={d.fullName} />
                <InfoRow label="Gender" value={d.gender} />
                <InfoRow label="Date of Birth" value={d.dob} />
                <InfoRow label="Age" value={d.age} />
                <InfoRow label="Nationality" value={d.nationality} />
                <InfoRow label="Marital Status" value={d.maritalStatus} />
            </Section>

            {/* 2. Contact */}
            <Section title="2. Contact Details">
                <InfoRow label="Primary Mobile" value={d.primaryPhone} />
                <InfoRow label="Alternate Mobile" value={d.alternatePhone} />
                <InfoRow label="Email ID" value={d.email} />
                <InfoRow label="Current Address" value={d.currentAddress} />
                <InfoRow label="Permanent Address" value={d.permanentAddress} />
            </Section>

            {/* 3. Passport */}
            <Section title="3. Passport Details">
                <InfoRow label="Passport Number" value={d.passportNo} />
                <InfoRow label="Place of Issue" value={d.passportPlace} />
                <InfoRow label="Date of Issue" value={d.passportIssueDate} />
                <InfoRow label="Date of Expiry" value={d.passportExpiryDate} />
                <InfoRow label="Previous Passport" value={d.hasPreviousPassport ? 'Yes' : 'No'} />
            </Section>

            {/* 4. Professional */}
            <Section title="4. Professional & Education Category">
                <InfoRow label="Qualification Category" value={d.qualificationCategory} />
                {d.qualificationSub && (() => {
                    const parts = d.qualificationSub.split('|')
                    return (<>
                        {parts[0] && <InfoRow label="Qualification" value={parts[0].trim()} />}
                        {parts[1] && <InfoRow label="Specialty" value={parts[1].trim()} />}
                        {parts[2] && <InfoRow label="Other Details" value={parts[2].trim()} />}
                    </>)
                })()}
                <InfoRow label="Other Specialty" value={d.specialty} />
                {d.profNotes && <tr><td colSpan={2} className="pt-2"><div className="p-2 rounded small" style={{ background: '#fffbea', border: '1px solid #ffc107' }}><strong>Notes:</strong> {d.profNotes}</div></td></tr>}
            </Section>

            {/* 5. Educational */}
            <Section title="5. Educational Details">
                <InfoRow label="University Name" value={d.univName} />
                <InfoRow label="Country of Study" value={d.studyCountry} />
                <InfoRow label="Admission Year" value={d.admissionYear} />
                <InfoRow label="Passing Year" value={d.passingYear} />
                <InfoRow label="Internship Date" value={d.internshipDate} />
                {d.eduNotes && <tr><td colSpan={2} className="pt-2"><div className="p-2 rounded small" style={{ background: '#fffbea', border: '1px solid #ffc107' }}><strong>Notes:</strong> {d.eduNotes}</div></td></tr>}
            </Section>

            {/* 6. Registration */}
            <Section title="6. Professional Registration Details">
                <InfoRow label="Council Name" value={d.councilName} />
                <InfoRow label="Reg. Number" value={d.regNo} />
                <InfoRow label="Valid Till" value={d.regValidTill} />
                <InfoRow label="Renewal Date" value={d.regRenewalDate} />
                <InfoRow label="Other Certificate" value={d.otherCert} />
                <InfoRow label="Notes" value={d.regNotes} />
            </Section>

            {/* 7. Work Experience */}
            <Section title="7. Work Experience Details">
                <InfoRow label="Hospital/Clinic" value={d.hospitalName} />
                <InfoRow label="Position" value={d.position} />
                <InfoRow label="Department" value={d.department} />
                <InfoRow label="City" value={d.city} />
                <InfoRow label="Period" value={`${d.expFrom || '-'} to ${d.expTo || '-'}`} />
                <InfoRow label="Total Experience" value={d.totalExperience} />
                <InfoRow label="Notes" value={d.expNotes} />
            </Section>

            {/* 8. Gulf Licensing */}
            <Section title="8. Gulf Licensing / Exam Details">
                {d.licensingExams
                    ? Object.entries(d.licensingExams).map(([country, exams]) =>
                        Array.isArray(exams) && exams.length > 0
                            ? <InfoRow key={country} label={country} value={exams.join(', ')} />
                            : null
                    )
                    : <tr><td colSpan={2} className="text-muted small">No exams selected</td></tr>
                }
                {d.gulfNotes && <tr><td colSpan={2} className="pt-2"><div className="p-2 rounded small" style={{ background: '#fffbea', border: '1px solid #ffc107' }}><strong>Notes:</strong> {d.gulfNotes}</div></td></tr>}
            </Section>

            {/* 9. Document Checklist */}
            <div className="mb-4">
                <div className="px-3 py-2 rounded-top" style={{ background: '#1a4fa0', color: 'white', fontWeight: 600, fontSize: '0.85rem' }}>
                    9. Document Submission Checklist
                </div>
                <div className="border border-top-0 rounded-bottom p-3" style={{ background: '#fff' }}>
                    <div className="row row-cols-2 g-2">
                        {[
                            '10th Marksheet', '12th Marksheet', '12th Credit Certificate',
                            'School Leaving Certificate', 'Passport Copy',
                            'Passport Size Photo (White Background)', 'Degree Certificate',
                            'All Semester Mark Sheets', 'Internship Certificate',
                            'Registration Certificate', 'Council Certificate',
                            'Good Standing Certificate', 'Experience Certificate',
                            'Updated CV', 'Renewal Certificate', 'BLS / ACLS Certificate',
                        ].map(doc => {
                            const checked = Array.isArray(d.documentChecklist) && d.documentChecklist.includes(doc)
                            return (
                                <div key={doc} className="col d-flex align-items-center gap-2 small">
                                    <span style={{
                                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                        width: 18, height: 18, borderRadius: 3, flexShrink: 0,
                                        background: checked ? '#22c55e' : '#f3f4f6',
                                        border: `2px solid ${checked ? '#16a34a' : '#d1d5db'}`,
                                        color: '#fff', fontWeight: 'bold', fontSize: 11
                                    }}>
                                        {checked ? '✓' : ''}
                                    </span>
                                    <span style={{ color: checked ? '#15803d' : '#6b7280' }}>{doc}</span>
                                </div>
                            )
                        })}
                    </div>
                    {d.docNotes && (
                        <div className="mt-3 p-2 rounded small" style={{ background: '#fffbea', border: '1px solid #ffc107' }}>
                            <strong>Notes:</strong> {d.docNotes}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

export default StudentClientFormTab
