import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, onSnapshot, doc, updateDoc, orderBy, query, getDoc, setDoc, getDocs } from 'firebase/firestore';
import { db, firebaseConfig } from './firebase';
import './AdminPortal.css';

// --- Icons ---
const IconLogo = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{color: 'white', fill: 'currentColor'}}>
    <path d="M4 10v9a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-9" fill="none"/>
    <path d="M12 2L2 8l10 6 10-6-10-6" fill="currentColor"/>
    <path d="M12 14v7" stroke="white" strokeWidth="2" fill="none"/>
    <path d="M8 11.5v6" stroke="white" strokeWidth="2" fill="none"/>
    <path d="M16 11.5v6" stroke="white" strokeWidth="2" fill="none"/>
  </svg>
);

const IconOverview    = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/></svg>;
const IconReports     = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1v19"/></svg>;
const IconProposals   = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.9 1.2 1.5 1.5 2.5"/><path d="M9 18h6"/><path d="M10 22h4"/></svg>;
const IconAnalytics   = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 3v18h18"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/></svg>;
const IconSettings    = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>;
const IconContact     = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>;
const IconSearch      = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>;
const IconPlus        = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14"/><path d="M12 5v14"/></svg>;
const IconUpArrow     = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M7 17L17 7"/><path d="M7 7h10v10"/></svg>;
const IconClipboard   = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/><path d="M9 14h6"/><path d="M9 18h6"/><path d="M9 10h6"/></svg>;
const IconClipboardClock = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/><circle cx="16" cy="16" r="4" fill="white"/><path d="M16 14v2l1.5 1.5"/></svg>;
const IconCheckCircle = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="M22 4L12 14.01l-3-3"/></svg>;
const IconChevron     = ({ open }) => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{transform: open ? 'rotate(180deg)' : 'none', transition:'transform 0.25s'}}><polyline points="6 9 12 15 18 9"/></svg>;

// Fallback mock data shown while Firestore loads
const fallbackReports = [
    { id:'1', title:'Pothole on 5th & Main',          author:'Maria S.',  authorEmail:'maria@example.com', time:'2 hours ago', category:'INFRASTRUCTURE', categoryClass:'badge-blue',   status:'PENDING',  urgency:'High',     description:'Large pothole causing traffic hazard.',  placeholderId:1 },
    { id:'2', title:'Broken Street Light - Oak St',   author:'David K.',  authorEmail:'david@example.com', time:'4 hours ago', category:'PUBLIC SAFETY',  categoryClass:'badge-purple', status:'PENDING',  urgency:'Critical', description:'Street light out near school zone.',      placeholderId:2 },
    { id:'3', title:'Graffiti in Central Park',        author:'Elena R.',  authorEmail:'elena@example.com', time:'6 hours ago', category:'SANITATION',     categoryClass:'badge-green',  status:'APPROVED', urgency:'Normal',   description:'Graffiti on the main fountain wall.',     placeholderId:3 },
    { id:'4', title:'Overflowing Bin - Library Plaza', author:'Civic Bot', authorEmail:'bot@civic.com',    time:'1 day ago',   category:'SANITATION',     categoryClass:'badge-green',  status:'RESOLVED', urgency:'Normal',   description:'Bins need emptying more frequently.',    placeholderId:4 },
];

const URGENCY_COLORS = { Normal:'#22c55e', High:'#f59e0b', Critical:'#ef4444' };

const AdminPortal = () => {
    const navigate = useNavigate();
    const [activeTab,    setActiveTab]    = useState('Reports');
    const [reports,      setReports]      = useState(fallbackReports);
    const [loading,      setLoading]      = useState(true);
    const [searchQuery,  setSearchQuery]  = useState('');
    const [currentPage,  setCurrentPage]  = useState(1);
    const [expandedId,   setExpandedId]   = useState(null);   // row expanded for details
    const [contactEdit, setContactEdit] = useState({
        email: '',
        phone: '',
        address: '',
        hours: ''
    });
    const [savingContact, setSavingContact] = useState(false);
    const [contactMessages, setContactMessages] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);

    /* ── Real-time Firestore listener ── */
    useEffect(() => {
        const q = query(collection(db, 'reports'), orderBy('createdAt', 'desc'));
        const unsub = onSnapshot(q, (snap) => {
            if (!snap.empty) {
                const rows = snap.docs.map((d, i) => {
                    const data = d.data();
                    const cat  = (data.category || 'other').toUpperCase();
                    const catClass =
                        cat.includes('INFRA') ? 'badge-blue'
                      : cat.includes('PARK')  ? 'badge-green'
                      : cat.includes('SAFE')  ? 'badge-purple'
                      : cat.includes('ENVIR') ? 'badge-green'
                      : cat.includes('TRANS') ? 'badge-blue'
                      :                         'badge-green';
                    return {
                        id:            d.id,
                        title:         data.title        || 'Untitled',
                        author:        data.authorName   || 'Anonymous',
                        authorEmail:   data.authorEmail  || '—',
                        description:   data.description  || '—',
                        time:          data.createdAt?.toDate ? timeAgo(data.createdAt.toDate()) : 'Just now',
                        category:      cat,
                        categoryClass: catClass,
                        status:        data.status       || 'PENDING',
                        urgency:       data.urgency      || 'Normal',
                        fileCount:     data.fileCount    || 0,
                        placeholderId: (i % 4) + 1,
                    };
                });
                setReports(rows);
            }
            setLoading(false);
        }, (err) => {
            console.error('Firestore read error:', err);
            setLoading(false);
        });
        return () => unsub();
    }, []);

    /* ── Fetch Contact Info ── */
    useEffect(() => {
        const fetchContact = async () => {
            try {
                const docRef = doc(db, 'settings', 'contact');
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    setContactEdit(docSnap.data());
                }
            } catch (err) {
                console.error('Error fetching contact:', err);
            }
        };
        fetchContact();
    }, []);

    /* ── Real-time listener for Contact messages ── */
    useEffect(() => {
        const q = query(collection(db, 'contact_messages'), orderBy('createdAt', 'desc'));
        const unsub = onSnapshot(q, (snap) => {
            console.log('contact_messages snapshot size=', snap.size);
            const msgs = snap.docs.map(d => {
                const data = d.data();
                console.log('contact message doc', d.id, data);
                return ({ id: d.id, ...data });
            });
            setContactMessages(msgs);
            setUnreadCount(msgs.filter(m => !m.read).length);
        }, (err) => {
            console.error('Error listening contact_messages:', err);
        });
        return () => unsub();
    }, []);

    const handleMarkRead = async (id) => {
        try {
            await updateDoc(doc(db, 'contact_messages', id), { read: true });
        } catch (err) {
            console.error('Failed to mark message read:', err);
        }
    };

    const [debugInfo, setDebugInfo] = useState(null);

    const handleTestRead = async () => {
        setDebugInfo({ loading: true });
        try {
            const q = query(collection(db, 'contact_messages'), orderBy('createdAt', 'desc'));
            const snap = await getDocs(q);
            const msgs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            console.log('Test read: got', msgs.length, 'messages');
            setDebugInfo({ loading: false, ok: true, count: msgs.length, sample: msgs.slice(0,3) });
        } catch (err) {
            console.error('Test read failed:', err);
            setDebugInfo({ loading: false, ok: false, error: err.message || String(err) });
        }
    };

    const handleSaveContact = async (e) => {
        e.preventDefault();
        setSavingContact(true);
        try {
            await setDoc(doc(db, 'settings', 'contact'), contactEdit);
            alert('Contact information updated successfully!');
        } catch (err) {
            console.error('Error saving contact:', err);
            alert('Failed to update contact information.');
        } finally {
            setSavingContact(false);
        }
    };

    /* ── Update status in Firestore ── */
    const handleStatusChange = async (id, newStatus) => {
        setReports(prev => prev.map(r => r.id === id ? { ...r, status: newStatus } : r));
        try {
            await updateDoc(doc(db, 'reports', id), { status: newStatus });
        } catch (err) {
            console.error('Update failed:', err);
            setReports(prev => prev.map(r => r.id === id ? { ...r, status: reports.find(x=>x.id===id)?.status } : r));
        }
    };

    const filteredReports = reports.filter(r =>
        r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.author.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const pendingCount  = reports.filter(r => r.status === 'PENDING').length;
    const approvedCount = reports.filter(r => r.status === 'APPROVED').length;

    return (
        <div className="admin-portal">
            <aside className="ap-sidebar">
                <div className="ap-brand" onClick={() => navigate('/')} style={{cursor:'pointer'}}>
                    <div className="ap-brand-icon"><IconLogo /></div>
                    <span className="ap-brand-name">Civic Curator</span>
                </div>

                <nav className="ap-nav">
                    {[['Overview',IconOverview],['Reports',IconReports],['Proposals',IconProposals],['Analytics',IconAnalytics],['Contact',IconContact]].map(([tab, Icon]) => (
                        <a key={tab} href="#" className={`ap-nav-item ${activeTab===tab?'active':''}`}
                           onClick={e=>{e.preventDefault();setActiveTab(tab);}}>
                            <div className="ap-active-indicator"/>
                            <Icon/>
                            {tab}
                            {tab === 'Contact' && unreadCount > 0 && (
                                <span className="ap-notif-bubble">{unreadCount}</span>
                            )}
                        </a>
                    ))}
                    <div className="ap-nav-section-title">ADMIN CONTROL</div>
                    <a href="#" className="ap-nav-item" onClick={e=>{e.preventDefault();alert('Settings opened!');}}>
                        <IconSettings/> Settings
                    </a>
                </nav>

                <div className="ap-user-profile" onClick={() => navigate('/login')}>
                    <div className="ap-user-avatar">
                        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                    </div>
                    <div className="ap-user-info">
                        <div className="ap-user-name">Admin</div>
                        <div className="ap-user-role">Sign Out</div>
                    </div>
                </div>
            </aside>

            <main className="ap-main">
                <header className="ap-header">
                    <div className="ap-header-title">
                        <h1>{activeTab}</h1>
                        <p>{activeTab === 'Contact' ? 'Update the public contact information shown on the Contact page.' : 'Review, approve, and resolve community-submitted reports.'}</p>
                    </div>
                    <div className="ap-header-actions">
                        <div className="ap-search-bar">
                            <IconSearch/>
                            <input type="text" placeholder="Search by title or author..."
                                value={searchQuery} onChange={e=>setSearchQuery(e.target.value)}/>
                        </div>
                        <button className="ap-btn-primary" onClick={() => navigate('/submit')}>
                            <IconPlus/> New Report
                        </button>
                    </div>
                </header>

                {/* Reports Content */}
                {activeTab === 'Reports' && (
                    <>
                        {/* Stats row */}
                        <div className="ap-stats-row">
                            <div className="ap-stat-card">
                                <div className="ap-stat-content">
                                    <h3 className="ap-stat-title">TOTAL SUBMISSIONS</h3>
                                    <div className="ap-stat-value">{reports.length}</div>
                                    <div className="ap-stat-trend positive"><IconUpArrow/><span>Live from Firestore</span></div>
                                </div>
                                <div className="ap-stat-icon-wrapper blue"><IconClipboard/></div>
                            </div>

                            <div className="ap-stat-card">
                                <div className="ap-stat-content">
                                    <h3 className="ap-stat-title">AWAITING REVIEW</h3>
                                    <div className="ap-stat-value">{pendingCount}</div>
                                    <div className="ap-stat-desc">Requires attention</div>
                                </div>
                                <div className="ap-stat-icon-wrapper yellow"><IconClipboardClock/></div>
                            </div>

                            <div className="ap-stat-card">
                                <div className="ap-stat-content">
                                    <h3 className="ap-stat-title">APPROVED & LIVE</h3>
                                    <div className="ap-stat-value">{approvedCount}</div>
                                    <div className="ap-stat-desc">Visible on Community page</div>
                                </div>
                                <div className="ap-stat-icon-wrapper green"><IconCheckCircle/></div>
                            </div>
                        </div>

                        {/* Reports table */}
                        <div className="ap-reports-section">
                            <div className="ap-reports-header">
                                <h2>Community Submissions</h2>
                                <a href="#" className="ap-view-all" onClick={e=>{e.preventDefault();setSearchQuery('');}}>
                                    Clear filter &rarr;
                                </a>
                            </div>

                            {loading ? (
                                <div className="ap-loading">
                                    <div className="ap-spinner"/>
                                    <span>Loading reports from Firestore…</span>
                                </div>
                            ) : (
                            <table className="ap-reports-table">
                                <thead>
                                    <tr>
                                        <th>SUBMISSION DETAILS</th>
                                        <th>CATEGORY</th>
                                        <th>URGENCY</th>
                                        <th>STATUS</th>
                                        <th>ACTIONS</th>
                                        <th></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredReports.map(report => (
                                        <React.Fragment key={report.id}>
                                        <tr className={expandedId===report.id ? 'row-expanded' : ''}>
                                            <td>
                                                <div className="ap-issue-cell">
                                                    <div className={`ap-issue-img placeholder-${report.placeholderId}`}/>
                                                    <div className="ap-issue-info">
                                                        <div className="ap-issue-title">{report.title}</div>
                                                        <div className="ap-issue-meta">
                                                            By <strong>{report.author}</strong> &bull; {report.time}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td><span className={`ap-badge ${report.categoryClass}`}>{report.category}</span></td>
                                            <td>
                                                <span className="ap-urgency-tag" style={{color: URGENCY_COLORS[report.urgency]||'#94a3b8', background: (URGENCY_COLORS[report.urgency]||'#94a3b8')+'18', border:`1px solid ${(URGENCY_COLORS[report.urgency]||'#94a3b8')}40`}}>
                                                    {report.urgency}
                                                </span>
                                            </td>
                                            <td>
                                                <span className={`ap-status ${
                                                    report.status==='APPROVED' ? 'status-approved'
                                                  : report.status==='RESOLVED' ? 'status-resolved'
                                                  : 'status-pending'}`}>
                                                    <span className="ap-status-dot"/> {report.status}
                                                </span>
                                            </td>
                                            <td>
                                                <div className="ap-action-group">
                                                    {report.status === 'PENDING' && (
                                                        <>
                                                        <button className="ap-action-btn ap-btn-approve"
                                                            onClick={() => handleStatusChange(report.id, 'APPROVED')}>
                                                            ✓ Approve
                                                        </button>
                                                        <button className="ap-action-btn ap-btn-reject"
                                                            onClick={() => handleStatusChange(report.id, 'RESOLVED')}>
                                                            Dismiss
                                                        </button>
                                                        </>
                                                    )}
                                                    {report.status === 'APPROVED' && (
                                                        <button className="ap-action-btn"
                                                            onClick={() => handleStatusChange(report.id, 'PENDING')}>
                                                            Revoke
                                                        </button>
                                                    )}
                                                    {report.status === 'RESOLVED' && (
                                                        <button className="ap-action-btn"
                                                            onClick={() => handleStatusChange(report.id, 'PENDING')}>
                                                            Reopen
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                            <td>
                                                <button className="ap-expand-btn"
                                                    onClick={() => setExpandedId(expandedId===report.id ? null : report.id)}
                                                    title="View details">
                                                    <IconChevron open={expandedId===report.id}/>
                                                </button>
                                            </td>
                                        </tr>

                                        {/* ── Expanded detail row ── */}
                                        {expandedId === report.id && (
                                        <tr key={`${report.id}-detail`} className="ap-detail-row">
                                            <td colSpan="6">
                                                <div className="ap-detail-panel">
                                                    <div className="ap-detail-grid">
                                                        <div className="ap-detail-block">
                                                            <div className="ap-detail-label">Description</div>
                                                            <div className="ap-detail-value ap-detail-desc">{report.description}</div>
                                                        </div>
                                                        <div className="ap-detail-block">
                                                            <div className="ap-detail-label">Submitted By</div>
                                                            <div className="ap-detail-value">{report.author}</div>
                                                            <div className="ap-detail-sub">{report.authorEmail}</div>
                                                        </div>
                                                        <div className="ap-detail-block">
                                                            <div className="ap-detail-label">Category</div>
                                                            <div className="ap-detail-value">{report.category}</div>
                                                        </div>
                                                        <div className="ap-detail-block">
                                                            <div className="ap-detail-label">Urgency</div>
                                                            <div className="ap-detail-value" style={{color: URGENCY_COLORS[report.urgency]||'inherit'}}>
                                                                {report.urgency}
                                                            </div>
                                                        </div>
                                                        <div className="ap-detail-block">
                                                            <div className="ap-detail-label">Submitted</div>
                                                            <div className="ap-detail-value">{report.time}</div>
                                                        </div>
                                                        <div className="ap-detail-block">
                                                            <div className="ap-detail-label">Files Attached</div>
                                                            <div className="ap-detail-value">{report.fileCount} file{report.fileCount!==1?'s':''}</div>
                                                        </div>
                                                    </div>

                                                    <div className="ap-detail-actions">
                                                        {report.status === 'PENDING' && (
                                                            <>
                                                            <button className="ap-action-btn ap-btn-approve ap-btn-lg"
                                                                onClick={() => handleStatusChange(report.id,'APPROVED')}>
                                                                ✓ Approve — Publish to Community
                                                            </button>
                                                            <button className="ap-action-btn ap-btn-reject ap-btn-lg"
                                                                onClick={() => handleStatusChange(report.id,'RESOLVED')}>
                                                                Dismiss Report
                                                            </button>
                                                            </>
                                                        )}
                                                        {report.status === 'APPROVED' && (
                                                            <div className="ap-detail-approved-msg">
                                                                ✅ This report is <strong>live on the Community page</strong>.
                                                                <button className="ap-action-btn" style={{marginLeft:16}}
                                                                    onClick={() => handleStatusChange(report.id,'PENDING')}>
                                                                    Revoke Approval
                                                                </button>
                                                            </div>
                                                        )}
                                                        {report.status === 'RESOLVED' && (
                                                            <div className="ap-detail-approved-msg" style={{color:'#94a3b8'}}>
                                                                This report was dismissed.
                                                                <button className="ap-action-btn" style={{marginLeft:16}}
                                                                    onClick={() => handleStatusChange(report.id,'PENDING')}>
                                                                    Reopen
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                        )}
                                        </React.Fragment>
                                    ))}
                                    {filteredReports.length === 0 && (
                                        <tr>
                                            <td colSpan="6" style={{textAlign:'center',padding:'40px',color:'#64748b'}}>
                                                {searchQuery ? `No results for "${searchQuery}"` : 'No submissions yet.'}
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                            )}

                            <div className="ap-pagination">
                                <div className="ap-pagination-info">
                                    Showing <strong>{filteredReports.length}</strong> of <strong>{reports.length}</strong> reports
                                </div>
                            </div>
                        </div>
                    </>
                )}

                {/* Contact Edit Tab Content */}
                {activeTab === 'Contact' && (
                    <div className="ap-contact-edit">
                        {/* Contact edit removed — not needed. Messages list shown below. */}
                        <div style={{marginBottom: '1rem'}}>
                            <strong>Debug:</strong> Project ID: <span style={{color:'#94a3b8'}}>{firebaseConfig.projectId}</span>
                            <button style={{marginLeft:12}} className="ap-action-btn" onClick={handleTestRead}>Test read</button>
                            {debugInfo && (
                                <div style={{marginTop:8, color: debugInfo.ok ? '#22c55e' : '#ef4444'}}>
                                    {debugInfo.loading ? 'Checking…' : debugInfo.ok ? `Read OK — ${debugInfo.count} messages (showing up to 3)` : `Read failed: ${debugInfo.error}`}
                                </div>
                            )}
                        </div>
                        {/* Contact messages list */}
                        <div style={{marginTop: '1.5rem'}}>
                            <h3 style={{marginBottom: '1rem'}}>Messages from visitors</h3>
                            {contactMessages.length === 0 ? (
                                <div style={{padding:'1rem', color:'#94a3b8'}}>No messages yet.</div>
                            ) : (
                                <div style={{display:'grid', gap:'0.75rem'}}>
                                    {contactMessages.map(msg => (
                                        <div key={msg.id} style={{background:'rgba(255,255,255,0.03)', padding:'1rem', borderRadius:8, display:'flex', justifyContent:'space-between', alignItems:'flex-start'}}>
                                            <div>
                                                <div style={{fontWeight:700}}>{msg.name || 'Anonymous'} <span style={{fontWeight:400, color:'#94a3b8', marginLeft:8}}>&lt;{msg.email || '—'}&gt;</span></div>
                                                <div style={{color:'#94a3b8', marginTop:6}}>{msg.subject || 'No subject'}</div>
                                                <div style={{marginTop:8, color:'#cbd5e1', whiteSpace:'pre-wrap'}}>{msg.message}</div>
                                                <div style={{marginTop:8, fontSize:'0.85rem', color:'#94a3b8'}}>{msg.createdAt && msg.createdAt.toDate ? timeAgo(msg.createdAt.toDate()) : 'Just now'}</div>
                                            </div>
                                            <div style={{display:'flex', flexDirection:'column', gap:8, marginLeft:16}}>
                                                {!msg.read ? (
                                                    <button className="ap-action-btn ap-btn-approve" onClick={() => handleMarkRead(msg.id)}>Mark read</button>
                                                ) : (
                                                    <div style={{color:'#94a3b8'}}>Read</div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default AdminPortal;

/* ── timeAgo helper ── */
function timeAgo(date) {
    const secs = Math.floor((Date.now() - date.getTime()) / 1000);
    if (secs < 60)    return 'Just now';
    if (secs < 3600)  return `${Math.floor(secs/60)}m ago`;
    if (secs < 86400) return `${Math.floor(secs/3600)}h ago`;
    return `${Math.floor(secs/86400)}d ago`;
}
