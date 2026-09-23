'use client'

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
    FiActivity, FiBookOpen, FiFileText, FiClipboard, FiCheckSquare,
    FiRefreshCw, FiClock, FiMapPin, FiCamera, FiUsers, FiAlertCircle
} from 'react-icons/fi'

const POLL_MS = 10000

const TYPE_META = {
    coursePdf: { label: 'Course PDFs', icon: FiBookOpen, color: '#3454d1' },
    freePdf: { label: 'Free PDFs', icon: FiFileText, color: '#17a673' },
    exam: { label: 'Exams', icon: FiClipboard, color: '#e8a100' },
    freeTest: { label: 'Free Tests', icon: FiCheckSquare, color: '#0ea5b7' },
}
const FILTERS = ['all', 'coursePdf', 'freePdf', 'exam', 'freeTest']

const pad = (n) => String(n).padStart(2, '0')

function formatElapsed(ms) {
    const total = Math.max(0, Math.floor(ms / 1000))
    const h = Math.floor(total / 3600)
    const m = Math.floor((total % 3600) / 60)
    const s = total % 60
    return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`
}

function formatAgo(ms) {
    const s = Math.max(0, Math.floor(ms / 1000))
    if (s < 5) return 'just now'
    if (s < 60) return `${s}s ago`
    return `${Math.floor(s / 60)}m ago`
}

function Avatar({ user }) {
    const [broken, setBroken] = useState(false)
    if (user.profileImage && !broken) {
        return (
            // eslint-disable-next-line @next/next/no-img-element
            <img
                src={user.profileImage}
                alt={user.name}
                width={40}
                height={40}
                className="rounded-circle flex-shrink-0"
                style={{ objectFit: 'cover' }}
                onError={() => setBroken(true)}
            />
        )
    }
    return (
        <div
            className="rounded-circle flex-shrink-0 d-flex align-items-center justify-content-center text-white fw-bold"
            style={{ width: 40, height: 40, background: '#3454d1' }}
        >
            {(user.name || '?').charAt(0).toUpperCase()}
        </div>
    )
}

function LiveDot({ color = '#17a673' }) {
    return (
        <span className="lv-dot" style={{ '--lv-color': color }} aria-hidden="true" />
    )
}

const LiveViewers = () => {
    const [data, setData] = useState(null)
    const [error, setError] = useState(null)
    const [refreshing, setRefreshing] = useState(false)
    const [filter, setFilter] = useState('all')
    const [selectedKey, setSelectedKey] = useState(null)
    const [clockOffset, setClockOffset] = useState(0) // server time - browser time
    const [lastUpdated, setLastUpdated] = useState(null)
    const [, setTick] = useState(0)
    const inFlight = useRef(false)

    const load = useCallback(async () => {
        if (inFlight.current) return
        inFlight.current = true
        setRefreshing(true)
        try {
            const res = await fetch('/api/admin/live-viewers', { cache: 'no-store' })
            const json = await res.json()
            if (!json.success) throw new Error(json.message || json.error || 'Failed to load')
            setClockOffset(new Date(json.serverTime).getTime() - Date.now())
            setData(json)
            setLastUpdated(new Date())
            setError(null)
        } catch (e) {
            setError(e.message || 'Failed to load live viewers')
        } finally {
            inFlight.current = false
            setRefreshing(false)
        }
    }, [])

    // Poll while the tab is visible; refresh immediately when it comes back.
    useEffect(() => {
        load()
        const poll = setInterval(() => {
            if (document.visibilityState === 'visible') load()
        }, POLL_MS)
        const onVisible = () => { if (document.visibilityState === 'visible') load() }
        document.addEventListener('visibilitychange', onVisible)
        return () => {
            clearInterval(poll)
            document.removeEventListener('visibilitychange', onVisible)
        }
    }, [load])

    // One clock for every running timer on the page.
    useEffect(() => {
        const t = setInterval(() => setTick(x => x + 1), 1000)
        return () => clearInterval(t)
    }, [])

    const now = Date.now() + clockOffset

    const groups = useMemo(() => {
        const all = data?.groups || []
        return filter === 'all' ? all : all.filter(g => g.type === filter)
    }, [data, filter])

    // Keep the selected group across refreshes; fall back to the busiest one.
    const selected = groups.find(g => g.key === selectedKey) || groups[0] || null

    const summary = data?.summary || { total: 0, coursePdf: 0, freePdf: 0, exam: 0, freeTest: 0 }

    return (
        <div className="live-viewers">
            {/* Toolbar */}
            <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3">
                <div className="d-flex align-items-center gap-2 text-muted">
                    <LiveDot />
                    <span className="fs-13">
                        Updates every {POLL_MS / 1000}s
                        {lastUpdated && <> · last update {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</>}
                    </span>
                </div>
                <button className="btn btn-sm btn-light border d-flex align-items-center gap-2" onClick={load} disabled={refreshing}>
                    <FiRefreshCw size={14} className={refreshing ? 'lv-spin' : ''} />
                    {refreshing ? 'Refreshing…' : 'Refresh'}
                </button>
            </div>

            {/* Summary cards — also the filter */}
            <div className="row g-3 mb-4">
                {FILTERS.map(key => {
                    const meta = key === 'all' ? { label: 'All live', icon: FiActivity, color: '#dc3545' } : TYPE_META[key]
                    const Icon = meta.icon
                    const count = key === 'all' ? summary.total : summary[key]
                    const active = filter === key
                    return (
                        <div className="col-6 col-md-4 col-xl" key={key}>
                            <button
                                type="button"
                                onClick={() => { setFilter(key); setSelectedKey(null) }}
                                className={`card w-100 h-100 text-start border ${active ? 'shadow-sm' : ''}`}
                                style={{ borderColor: active ? meta.color : undefined, borderWidth: active ? 2 : 1, background: '#fff' }}
                            >
                                <div className="card-body d-flex align-items-center gap-3 p-3">
                                    <div
                                        className="rounded-3 d-flex align-items-center justify-content-center flex-shrink-0"
                                        style={{ width: 44, height: 44, background: `${meta.color}1a`, color: meta.color }}
                                    >
                                        <Icon size={20} />
                                    </div>
                                    <div className="min-w-0">
                                        <div className="d-flex align-items-center gap-2">
                                            <span className="fs-4 fw-bold text-dark">{data ? count : '–'}</span>
                                            {count > 0 && <LiveDot color={meta.color} />}
                                        </div>
                                        <div className="text-muted fs-12 text-truncate">{meta.label}</div>
                                    </div>
                                </div>
                            </button>
                        </div>
                    )
                })}
            </div>

            {error && (
                <div className="alert alert-danger d-flex align-items-center gap-2">
                    <FiAlertCircle /> {error}
                </div>
            )}

            {!data && !error ? (
                <LoadingState />
            ) : groups.length === 0 ? (
                <div className="card border">
                    <div className="card-body text-center py-5 text-muted">
                        <FiUsers size={40} className="mb-3 opacity-50" />
                        <h6 className="mb-1">Nobody is viewing right now</h6>
                        <p className="mb-0 fs-13">Students appear here as soon as they open a PDF or start a test.</p>
                    </div>
                </div>
            ) : (
                <div className="row g-3">
                    {/* Groups */}
                    <div className="col-lg-4">
                        <div className="card border h-100">
                            <div className="card-header bg-white fw-semibold">
                                {filter === 'all' ? 'Courses, materials & tests' : TYPE_META[filter].label}
                            </div>
                            <div className="list-group list-group-flush" style={{ maxHeight: 560, overflowY: 'auto' }}>
                                {groups.map(g => {
                                    const meta = TYPE_META[g.type]
                                    const Icon = meta.icon
                                    const isSel = selected?.key === g.key
                                    return (
                                        <button
                                            key={g.key}
                                            type="button"
                                            onClick={() => setSelectedKey(g.key)}
                                            className={`list-group-item list-group-item-action d-flex align-items-center gap-3 py-3 ${isSel ? 'active-group' : ''}`}
                                            style={isSel ? { background: `${meta.color}12`, borderLeft: `3px solid ${meta.color}` } : { borderLeft: '3px solid transparent' }}
                                        >
                                            <div
                                                className="rounded-2 d-flex align-items-center justify-content-center flex-shrink-0"
                                                style={{ width: 36, height: 36, background: `${meta.color}1a`, color: meta.color }}
                                            >
                                                <Icon size={16} />
                                            </div>
                                            <div className="flex-grow-1 min-w-0">
                                                <div className="fw-semibold text-dark text-truncate" title={g.title}>{g.title}</div>
                                                <div className="fs-12 text-muted">{meta.label}</div>
                                            </div>
                                            <span
                                                className="badge rounded-pill d-flex align-items-center gap-1"
                                                style={{ background: meta.color, color: '#fff' }}
                                                title={`${g.count} live now`}
                                            >
                                                <span className="lv-dot lv-dot-white" aria-hidden="true" /> {g.count}
                                            </span>
                                        </button>
                                    )
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Viewers of the selected group */}
                    <div className="col-lg-8">
                        {selected && (
                            <div className="card border h-100">
                                <div className="card-header bg-white d-flex align-items-center justify-content-between gap-2">
                                    <div className="min-w-0">
                                        <div className="fw-semibold text-dark text-truncate">{selected.title}</div>
                                        <div className="fs-12 text-muted">{TYPE_META[selected.type].label}</div>
                                    </div>
                                    <span className="badge bg-danger-subtle text-danger d-flex align-items-center gap-2 px-3 py-2">
                                        <LiveDot color="#dc3545" /> {selected.count} watching now
                                    </span>
                                </div>
                                <div className="table-responsive">
                                    <table className="table table-hover align-middle mb-0">
                                        <thead className="table-light">
                                            <tr>
                                                <th className="ps-3">Student</th>
                                                <th>Viewing</th>
                                                <th>Started</th>
                                                <th className="text-end pe-3">Live timer</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {selected.viewers.map(v => {
                                                const isExam = selected.type === 'exam' || selected.type === 'freeTest'
                                                const elapsed = now - new Date(v.startedAt).getTime()
                                                const remaining = v.endsAt ? new Date(v.endsAt).getTime() - now : null
                                                return (
                                                    <tr key={v.id}>
                                                        <td className="ps-3">
                                                            <div className="d-flex align-items-center gap-2">
                                                                <Avatar user={v.user} />
                                                                <div className="min-w-0">
                                                                    <div className="fw-semibold text-dark text-truncate">{v.user.name}</div>
                                                                    <div className="fs-12 text-muted text-truncate">{v.user.email}</div>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td>
                                                            <div className="text-dark text-truncate" style={{ maxWidth: 220 }} title={v.item}>{v.item}</div>
                                                            <div className="fs-12 text-muted d-flex flex-wrap gap-2">
                                                                <span>{v.detail}</span>
                                                                {v.selfieCount > 0 && <span className="d-flex align-items-center gap-1"><FiCamera size={11} /> {v.selfieCount}</span>}
                                                                {v.location && <span className="d-flex align-items-center gap-1 text-truncate" style={{ maxWidth: 160 }}><FiMapPin size={11} /> {v.location}</span>}
                                                            </div>
                                                        </td>
                                                        <td>
                                                            <div className="text-dark">
                                                                {new Date(v.startedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                                            </div>
                                                            {!isExam && v.lastActiveAt && (
                                                                <div className="fs-12 text-muted">active {formatAgo(now - new Date(v.lastActiveAt).getTime())}</div>
                                                            )}
                                                        </td>
                                                        <td className="text-end pe-3">
                                                            <div className="d-inline-flex align-items-center gap-2 fw-bold font-monospace text-dark">
                                                                <LiveDot color="#dc3545" />
                                                                {formatElapsed(elapsed)}
                                                            </div>
                                                            {remaining !== null && (
                                                                <div className={`fs-12 d-flex align-items-center justify-content-end gap-1 ${remaining < 5 * 60 * 1000 ? 'text-danger' : 'text-muted'}`}>
                                                                    <FiClock size={11} /> {remaining > 0 ? `${formatElapsed(remaining)} left` : 'time up'}
                                                                </div>
                                                            )}
                                                        </td>
                                                    </tr>
                                                )
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            <style>{`
                .live-viewers .min-w-0 { min-width: 0; }
                .live-viewers .lv-dot {
                    width: 8px; height: 8px; border-radius: 50%;
                    background: var(--lv-color, #17a673); display: inline-block; position: relative;
                }
                .live-viewers .lv-dot::after {
                    content: ''; position: absolute; inset: 0; border-radius: 50%;
                    background: inherit; animation: lv-pulse 1.6s ease-out infinite;
                }
                .live-viewers .lv-dot-white { background: #fff; }
                @keyframes lv-pulse { from { transform: scale(1); opacity: .7; } to { transform: scale(2.6); opacity: 0; } }
                .live-viewers .lv-spin { animation: lv-spin .8s linear infinite; }
                @keyframes lv-spin { to { transform: rotate(360deg); } }
                .live-viewers .lv-bone {
                    background: linear-gradient(90deg, #eceef1 25%, #f5f6f8 37%, #eceef1 63%);
                    background-size: 400% 100%; animation: lv-shimmer 1.4s ease infinite; border-radius: 6px;
                }
                @keyframes lv-shimmer { from { background-position: 100% 50%; } to { background-position: 0 50%; } }
                @media (prefers-reduced-motion: reduce) {
                    .live-viewers .lv-dot::after, .live-viewers .lv-bone, .live-viewers .lv-spin { animation: none; }
                }
            `}</style>
        </div>
    )
}

function LoadingState() {
    return (
        <div className="row g-3">
            <div className="col-lg-4">
                <div className="card border p-3">
                    {[0, 1, 2, 3].map(i => (
                        <div key={i} className="d-flex align-items-center gap-3 py-2">
                            <div className="lv-bone" style={{ width: 36, height: 36 }} />
                            <div className="flex-grow-1">
                                <div className="lv-bone mb-2" style={{ height: 12, width: '70%' }} />
                                <div className="lv-bone" style={{ height: 10, width: '40%' }} />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            <div className="col-lg-8">
                <div className="card border p-3">
                    {[0, 1, 2, 3, 4].map(i => (
                        <div key={i} className="d-flex align-items-center gap-3 py-2">
                            <div className="lv-bone rounded-circle" style={{ width: 40, height: 40 }} />
                            <div className="flex-grow-1">
                                <div className="lv-bone mb-2" style={{ height: 12, width: '45%' }} />
                                <div className="lv-bone" style={{ height: 10, width: '30%' }} />
                            </div>
                            <div className="lv-bone" style={{ height: 16, width: 64 }} />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}

export default LiveViewers
