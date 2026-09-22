'use client'

import React, { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { FiX, FiZoomIn, FiZoomOut, FiRotateCw, FiMenu } from 'react-icons/fi'

// A view-only PDF modal styled like a normal browser PDF viewer (thumbnail
// sidebar, dark toolbar, zoom/rotate) but with every "get the bytes out"
// control removed — no download, no print, no open-in-new-tab. The PDF is
// fetched from an authenticated endpoint and rendered page-by-page onto a
// canvas via pdfjs, so the raw file never touches an <a href>/<iframe src>.
// Resolve the actual bytes URL for a PDF: ask /api/storage/pdf-token for a
// short-lived signed token bound to this exact path, then hand pdfjs the
// token-gated secure-file URL. Without a valid token the file 404s.
async function resolveSecurePdfUrl({ filePath, courseId, lectureId, materialId }) {
    const res = await fetch('/api/storage/pdf-token', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: filePath, courseId, lectureId, materialId }),
    })
    if (!res.ok) throw new Error('Not authorized to view this PDF')
    const data = await res.json()
    if (!data?.success || !data?.token) throw new Error('Not authorized to view this PDF')
    return `/api/storage/secure-file?path=${encodeURIComponent('/' + data.path)}&token=${encodeURIComponent(data.token)}`
}

const AdminPdfViewerModal = ({ isOpen, onClose, fileUrl, filePath, courseId, lectureId, materialId, fileTitle }) => {
    const pdfDocRef = useRef(null)
    const scrollContainerRef = useRef(null)
    const pageContainerRefs = useRef({})
    // Set while goToPage() is driving a programmatic scroll, so the scroll
    // IntersectionObserver doesn't fight it and re-set pageNum mid-flight.
    const isProgrammaticScrollRef = useRef(false)
    const programmaticScrollTimeoutRef = useRef(null)

    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()

    const [pdfjsLib, setPdfjsLib] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [pageNum, setPageNum] = useState(1)
    const [pageInput, setPageInput] = useState('1')
    const [numPages, setNumPages] = useState(0)
    const [scale, setScale] = useState(1.1)
    const [rotation, setRotation] = useState(0)
    const [showSidebar, setShowSidebar] = useState(true)

    useEffect(() => {
        document.body.style.overflow = isOpen ? 'hidden' : 'unset'
        return () => { document.body.style.overflow = 'unset' }
    }, [isOpen])

    // Reflect which file is open in the URL (?file=<path>) so the address bar
    // identifies it — purely cosmetic/shareable, doesn't drive loading.
    useEffect(() => {
        if (!isOpen) return
        const fileId = filePath || fileUrl
        if (!fileId) return

        const params = new URLSearchParams(searchParams.toString())
        params.set('file', fileId)
        router.replace(`${pathname}?${params.toString()}`, { scroll: false })

        return () => {
            const cleanup = new URLSearchParams(searchParams.toString())
            cleanup.delete('file')
            const qs = cleanup.toString()
            router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen, filePath, fileUrl])

    useEffect(() => {
        if (!isOpen || (!fileUrl && !filePath)) return

        let cancelled = false
        setLoading(true)
        setError(null)
        setPageNum(1)
        setRotation(0)

        async function load() {
            try {
                const lib = await import('pdfjs-dist/build/pdf')
                lib.GlobalWorkerOptions.workerSrc = '/pdfjs/pdf.worker.min.js'

                const resolvedUrl = filePath
                    ? await resolveSecurePdfUrl({ filePath, courseId, lectureId, materialId })
                    : fileUrl

                const response = await fetch(resolvedUrl, { credentials: 'include' })
                if (!response.ok) throw new Error('Failed to load PDF')
                const data = await response.arrayBuffer()
                if (cancelled) return

                const pdfDoc = await lib.getDocument({ data }).promise
                if (cancelled) return

                pdfDocRef.current = pdfDoc
                setPdfjsLib(lib)
                setNumPages(pdfDoc.numPages)
                setLoading(false)
            } catch (err) {
                if (!cancelled) {
                    console.error('PDF load error:', err)
                    setError(err?.message || 'Failed to load PDF for viewing.')
                    setLoading(false)
                }
            }
        }

        load()

        return () => {
            cancelled = true
            if (pdfDocRef.current) {
                pdfDocRef.current.destroy()
                pdfDocRef.current = null
            }
        }
    }, [isOpen, fileUrl, filePath, courseId, lectureId, materialId])

    useEffect(() => { setPageInput(String(pageNum)) }, [pageNum])

    // Every page stays mounted in the scroll list (see PdfPage below); this
    // just tracks which one is currently most visible, so the toolbar's
    // "N / total" counter and the active thumbnail follow natural scrolling —
    // like a real PDF viewer, instead of only advancing on explicit clicks.
    useEffect(() => {
        const container = scrollContainerRef.current
        if (!container || numPages === 0) return

        const observer = new IntersectionObserver(
            (entries) => {
                if (isProgrammaticScrollRef.current) return
                const visible = entries
                    .filter((e) => e.isIntersecting)
                    .sort((a, b) => b.intersectionRatio - a.intersectionRatio)
                if (visible[0]) {
                    const n = Number(visible[0].target.dataset.pageNumber)
                    if (n) setPageNum(n)
                }
            },
            { root: container, threshold: [0.5] }
        )

        Object.values(pageContainerRefs.current).forEach((el) => {
            if (el) observer.observe(el)
        })

        return () => observer.disconnect()
    }, [numPages])

    const goToPage = (n) => {
        const clamped = Math.min(Math.max(1, n), numPages || 1)
        const el = pageContainerRefs.current[clamped]
        if (el) {
            isProgrammaticScrollRef.current = true
            el.scrollIntoView({ behavior: 'smooth', block: 'start' })
            clearTimeout(programmaticScrollTimeoutRef.current)
            // Smooth-scroll has no completion callback — release the guard
            // after it should reasonably have settled.
            programmaticScrollTimeoutRef.current = setTimeout(() => {
                isProgrammaticScrollRef.current = false
            }, 600)
        }
        setPageNum(clamped)
    }

    const handlePageInputSubmit = (e) => {
        e.preventDefault()
        const n = parseInt(pageInput, 10)
        if (!isNaN(n)) goToPage(n)
        else setPageInput(String(pageNum))
    }

    if (!isOpen) return null
    if (typeof document === 'undefined') return null

    return createPortal(
        <div
            style={{
                position: 'fixed', inset: 0, zIndex: 2000,
                display: 'flex', flexDirection: 'column',
                background: '#525659'
            }}
            onContextMenu={(e) => e.preventDefault()}
        >
            {/* Toolbar */}
            <div style={{
                background: '#323639', color: '#e8eaed', height: '48px', flexShrink: 0,
                display: 'flex', alignItems: 'center', padding: '0 8px', gap: '8px',
                fontSize: '14px', userSelect: 'none'
            }}>
                <button
                    onClick={() => setShowSidebar(s => !s)}
                    title="Toggle thumbnails"
                    style={toolbarBtnStyle}
                >
                    <FiMenu size={18} />
                </button>

                <span style={{ flexShrink: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginRight: 'auto', paddingLeft: '4px' }}>
                    {fileTitle || 'PDF Viewer'}
                </span>

                {numPages > 0 && (
                    <>
                        <form onSubmit={handlePageInputSubmit} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <input
                                value={pageInput}
                                onChange={(e) => setPageInput(e.target.value)}
                                onBlur={handlePageInputSubmit}
                                style={{
                                    width: '36px', textAlign: 'center', background: '#202124',
                                    color: '#e8eaed', border: '1px solid #5f6368', borderRadius: '2px',
                                    fontSize: '13px', padding: '3px 2px'
                                }}
                            />
                            <span style={{ color: '#9aa0a6' }}>/ {numPages}</span>
                        </form>

                        <div style={{ width: '1px', height: '24px', background: '#5f6368', margin: '0 4px' }} />

                        <button onClick={() => setScale(s => Math.max(0.4, s - 0.15))} title="Zoom out" style={toolbarBtnStyle}>
                            <FiZoomOut size={16} />
                        </button>
                        <span style={{ width: '42px', textAlign: 'center', color: '#9aa0a6', fontSize: '13px' }}>
                            {Math.round(scale / 1.1 * 100)}%
                        </span>
                        <button onClick={() => setScale(s => Math.min(4, s + 0.15))} title="Zoom in" style={toolbarBtnStyle}>
                            <FiZoomIn size={16} />
                        </button>

                        <button onClick={() => setRotation(r => (r + 90) % 360)} title="Rotate" style={toolbarBtnStyle}>
                            <FiRotateCw size={16} />
                        </button>

                        <div style={{ width: '1px', height: '24px', background: '#5f6368', margin: '0 4px' }} />
                    </>
                )}

                <button onClick={onClose} title="Close" style={toolbarBtnStyle}>
                    <FiX size={20} />
                </button>
            </div>

            {/* Body */}
            <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
                {showSidebar && numPages > 0 && (
                    <div className="pdf-thumb-list" style={{
                        width: '150px', flexShrink: 0, background: '#2b2e30',
                        overflowY: 'auto', padding: '12px 0'
                    }}>
                        {Array.from({ length: numPages }, (_, i) => i + 1).map((n) => (
                            <PageThumbnail
                                key={n}
                                pdfDoc={pdfDocRef.current}
                                pageNumber={n}
                                isActive={n === pageNum}
                                onClick={() => goToPage(n)}
                            />
                        ))}
                    </div>
                )}

                <div
                    ref={scrollContainerRef}
                    style={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '24px', gap: '16px' }}
                >
                    {loading && (
                        <div style={{ color: '#e8eaed', textAlign: 'center', alignSelf: 'center', margin: 'auto' }}>
                            <div className="spinner-border text-light" role="status"></div>
                            <div className="mt-2">Loading PDF...</div>
                        </div>
                    )}
                    {error && <div style={{ color: '#f28b82', alignSelf: 'center', margin: 'auto' }}>{error}</div>}
                    {!loading && !error && Array.from({ length: numPages }, (_, i) => i + 1).map((n) => (
                        <div
                            key={n}
                            ref={(el) => { pageContainerRefs.current[n] = el }}
                            data-page-number={n}
                        >
                            <PdfPage
                                pdfDoc={pdfDocRef.current}
                                pageNumber={n}
                                scale={scale}
                                rotation={rotation}
                            />
                        </div>
                    ))}
                </div>
            </div>
        </div>,
        document.body
    )
}

const toolbarBtnStyle = {
    background: 'transparent', border: 'none', color: '#e8eaed',
    width: '32px', height: '32px', borderRadius: '4px',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer', flexShrink: 0
}

function PageThumbnail({ pdfDoc, pageNumber, isActive, onClick }) {
    const canvasRef = useRef(null)
    const containerRef = useRef(null)
    const renderedRef = useRef(false)

    useEffect(() => {
        const el = containerRef.current
        if (!el || !pdfDoc) return

        const renderThumb = async () => {
            if (renderedRef.current) return
            renderedRef.current = true
            try {
                const page = await pdfDoc.getPage(pageNumber)
                const viewport = page.getViewport({ scale: 0.22 })
                const canvas = canvasRef.current
                if (!canvas) return
                canvas.width = viewport.width
                canvas.height = viewport.height
                await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise
            } catch {
                renderedRef.current = false
            }
        }

        const observer = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting) renderThumb()
        }, { rootMargin: '300px' })
        observer.observe(el)
        return () => observer.disconnect()
    }, [pdfDoc, pageNumber])

    return (
        <div
            ref={containerRef}
            onClick={onClick}
            style={{
                margin: '0 auto 14px', width: '110px', cursor: 'pointer',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px'
            }}
        >
            <div style={{
                border: isActive ? '2px solid #8ab4f8' : '2px solid transparent',
                background: '#fff', display: 'flex', minHeight: '60px', alignItems: 'center'
            }}>
                <canvas ref={canvasRef} style={{ display: 'block', maxWidth: '100%' }} />
            </div>
            <span style={{ color: isActive ? '#8ab4f8' : '#9aa0a6', fontSize: '11px' }}>{pageNumber}</span>
        </div>
    )
}

// One page inside the continuous-scroll list. Renders lazily (only once it's
// near the viewport, via IntersectionObserver — same approach as the
// thumbnail strip) and re-renders whenever zoom/rotation change.
function PdfPage({ pdfDoc, pageNumber, scale, rotation }) {
    const canvasRef = useRef(null)
    const containerRef = useRef(null)
    const renderTaskRef = useRef(null)
    const [isVisible, setIsVisible] = useState(false)

    useEffect(() => {
        const el = containerRef.current
        if (!el) return

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting) {
                    setIsVisible(true)
                }
            },
            { rootMargin: '800px 0px' }
        )
        observer.observe(el)
        return () => observer.disconnect()
    }, [])

    useEffect(() => {
        if (!pdfDoc || !isVisible) return
        let cancelled = false

        async function render() {
            try {
                const page = await pdfDoc.getPage(pageNumber)
                if (cancelled) return
                const viewport = page.getViewport({ scale, rotation })
                const canvas = canvasRef.current
                if (!canvas) return
                canvas.width = viewport.width
                canvas.height = viewport.height

                if (renderTaskRef.current) renderTaskRef.current.cancel()
                const renderTask = page.render({ canvasContext: canvas.getContext('2d'), viewport })
                renderTaskRef.current = renderTask
                await renderTask.promise
            } catch (err) {
                if (err?.name !== 'RenderingCancelledException') {
                    console.error('PDF page render error:', err)
                }
            }
        }

        render()
        return () => { cancelled = true }
    }, [pdfDoc, pageNumber, scale, rotation, isVisible])

    return (
        <div ref={containerRef} style={{ minHeight: isVisible ? undefined : '400px' }}>
            {isVisible ? (
                <canvas
                    ref={canvasRef}
                    onContextMenu={(e) => e.preventDefault()}
                    style={{ display: 'block', boxShadow: '0 2px 10px rgba(0,0,0,0.4)', userSelect: 'none' }}
                />
            ) : (
                <div style={{ width: '600px', maxWidth: '80vw', height: '400px', background: '#3c3f41' }} />
            )}
        </div>
    )
}

export default AdminPdfViewerModal
