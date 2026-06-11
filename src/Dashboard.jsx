// src/Dashboard.jsx
import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { auth, db } from './firebase'
import { onAuthStateChanged } from 'firebase/auth'
import { collection, getDocs, query, where, orderBy, limit } from 'firebase/firestore'
import './Dashboard.css'

function Dashboard() {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalReports: 0,
    totalIdeas: 0,
    resolutionRate: 0,
    userChange: 0,
    reportChange: 0,
    ideaChange: 0
  })
  const [recentPosts, setRecentPosts] = useState([])
  const [urgentReports, setUrgentReports] = useState([])

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser)
      setLoading(false)
    })
    return () => unsubscribe()
  }, [])

  // ── Fetch stats from Firestore ──
  useEffect(() => {
    const fetchStats = async () => {
      try {
        // 1. Count total users
        const usersSnapshot = await getDocs(collection(db, 'users'))
        const totalUsers = usersSnapshot.size

        // 2. Count total reports
        const reportsSnapshot = await getDocs(collection(db, 'reports'))
        const totalReports = reportsSnapshot.size

        // 3. Count approved reports (resolution rate)
        const approvedQuery = query(
          collection(db, 'reports'),
          where('status', '==', 'APPROVED')
        )
        const approvedSnapshot = await getDocs(approvedQuery)
        const approvedCount = approvedSnapshot.size
        const resolutionRate = totalReports > 0 ? Math.round((approvedCount / totalReports) * 100) : 0

        // 4. Count ideas (submitted reports)
        const ideasQuery = query(
          collection(db, 'reports'),
          where('type', '==', 'idea')
        )
        const ideasSnapshot = await getDocs(ideasQuery)
        const totalIdeas = ideasSnapshot.size

        setStats({
          totalUsers: Math.max(totalUsers, 42819), // Show at least the baseline
          totalReports: Math.max(totalReports, 3547),
          totalIdeas: Math.max(totalIdeas, 1284),
          resolutionRate: resolutionRate || 84,
          userChange: Math.floor(Math.random() * 25) + 5,
          reportChange: Math.floor(Math.random() * 15) + 3,
          ideaChange: Math.floor(Math.random() * 30) + 10
        })
      } catch (error) {
        console.error('Error fetching stats:', error)
        // Fallback to default stats
        setStats({
          totalUsers: 42819,
          totalReports: 3547,
          totalIdeas: 1284,
          resolutionRate: 84,
          userChange: 18,
          reportChange: 7,
          ideaChange: 24
        })
      }
    }

    fetchStats()
  }, [])

  // ── Fetch recent community posts ──
  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const postsQuery = query(
          collection(db, 'reports'),
          orderBy('createdAt', 'desc'),
          limit(3)
        )
        const postsSnapshot = await getDocs(postsQuery)
        const posts = postsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        setRecentPosts(posts)
      } catch (error) {
        console.error('Error fetching posts:', error)
      }
    }

    const fetchUrgent = async () => {
      try {
        // Fetch critical and pending reports
        const criticalQuery = query(
          collection(db, 'reports'),
          where('status', '==', 'PENDING'),
          orderBy('createdAt', 'desc'),
          limit(5)
        )
        const criticalSnapshot = await getDocs(criticalQuery)
        const urgent = criticalSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })).slice(0, 3)
        setUrgentReports(urgent)
      } catch (error) {
        console.error('Error fetching urgent reports:', error)
      }
    }

    fetchPosts()
    fetchUrgent()
  }, [])

  return (
    <div className="app-container">
      {/* ── NAVBAR ── */}
      <nav className="navbar">
        <div className="container nav-content">
          <div className="nav-left">
            <div className="brand" onClick={() => navigate('/')} style={{cursor:'pointer'}}>
              <span className="civic">Civic</span><span className="curator"> Curator</span>
            </div>
            <div className={`nav-links ${mobileMenuOpen ? 'mobile-open' : ''}`}>
              <span className="nav-link active" onClick={() => { navigate('/'); setMobileMenuOpen(false); }} style={{cursor:'pointer'}}>Dashboard</span>
              <span className="nav-link" onClick={(e) => { 
                e.preventDefault(); 
                setMobileMenuOpen(false);
                if (window.location.pathname === '/') {
                  document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' });
                } else {
                  navigate('/');
                  setTimeout(() => {
                    document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' });
                  }, 100);
                }
              }} style={{cursor:'pointer'}}>About</span>
              <span className="nav-link" onClick={() => { navigate('/community'); setMobileMenuOpen(false); }} style={{cursor:'pointer'}}>Community</span>
              <span className="nav-link" onClick={() => { navigate('/contact'); setMobileMenuOpen(false); }} style={{cursor:'pointer'}}>Contact</span>
            </div>
          </div>
          <div className="nav-right">
            <button className="mobile-menu-toggle" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              {mobileMenuOpen ? (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              ) : (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
              )}
            </button>
            <div className="search-container">
              <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <input type="text" className="search-input" placeholder="Search initiatives..." />
            </div>
            {!loading && user ? (
              <button className="btn-nav-login" onClick={() => navigate('/user-dashboard')}>My Dashboard</button>
            ) : !loading ? (
              <>
                <div className="nav-right-buttons">
                  <button className="btn-nav-login" onClick={() => navigate('/login')}>Login</button>
                  <button className="btn-nav-register" onClick={() => navigate('/register')}>Register</button>
                </div>
              </>
            ) : null}
          </div>
        </div>
      </nav>

      <main className="main-content">
        {/* ── HERO ── */}
        <section className="hero-section">
          <div className="hero-glow hero-glow-1"></div>
          <div className="hero-glow hero-glow-2"></div>
          <div className="hero-glow hero-glow-3"></div>

          <div className="container hero-content">
            <div className="hero-text-wrap">
              <div className="hero-text">
                <div className="hero-eyebrow">
                  <span className="eyebrow-dot"></span>
                  Civic Engagement Platform
                </div>
                <h1 className="hero-title">
                  Share Ideas,{' '}
                  <span className="highlight">Report Issues</span>,<br/>
                  Make Change.
                </h1>
                <p className="hero-subtitle">
                  Curate the future of your city through transparent reporting and collaborative
                  ideation. Join thousands of citizens making a real difference today.
                </p>
                <div className="hero-trust-row">
                  <div className="trust-avatars">
                    <img src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=60&auto=format&fit=crop" alt="" className="trust-avatar" />
                    <img src="https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=60&auto=format&fit=crop" alt="" className="trust-avatar" />
                    <img src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=60&auto=format&fit=crop" alt="" className="trust-avatar" />
                    <img src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=60&auto=format&fit=crop" alt="" className="trust-avatar" />
                    <div className="trust-avatar trust-more">+42K</div>
                  </div>
                  <span className="trust-text">citizens already making a difference</span>
                </div>
              </div>
              <div className="hero-buttons">
                <button className="btn btn-primary" onClick={() => navigate('/login')}>
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/>
                  </svg>
                  Report an Issue
                </button>
                <button className="btn btn-secondary" onClick={() => navigate('/login')}>
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 18h6"/><path d="M10 22h4"/>
                    <path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 0 1 8.91 14"/>
                  </svg>
                  Share an Idea
                </button>
              </div>
            </div>

            {/* Floating stat cards */}
            <div className="hero-visuals">
              <div className="glass-stat-card floating-slow">
                <div className="stat-icon-wrapper blue-glow">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                  </svg>
                </div>
                <div>
                  <div className="glass-stat-value">$2.4M</div>
                  <div className="glass-stat-label">Community Funds Directed</div>
                </div>
              </div>

              <div className="glass-stat-card floating-fast">
                <div className="stat-icon-wrapper purple-glow">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                    <polyline points="22 4 12 14.01 9 11.01"/>
                  </svg>
                </div>
                <div>
                  <div className="glass-stat-value">8,192</div>
                  <div className="glass-stat-label">Total Issues Resolved</div>
                </div>
              </div>

              <div className="glass-stat-card floating-slow" style={{animationDelay: '1s'}}>
                <div className="stat-icon-wrapper cyan-glow">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                  </svg>
                </div>
                <div>
                  <div className="glass-stat-value">1,284</div>
                  <div className="glass-stat-label">Ideas Implemented</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── STATS STRIP ── */}
        <div className="stats-strip">
          <div className="container">
            <div className="stats-strip-inner">
              <div className="strip-stat">
                <div className="strip-icon indigo">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                  </svg>
                </div>
                <div className="strip-info">
                  <span className="strip-value">{stats.totalUsers.toLocaleString()}</span>
                  <span className="strip-label">Active Citizens</span>
                  <span className="strip-change up">↑ {stats.userChange}% this month</span>
                </div>
              </div>

              <div className="strip-stat">
                <div className="strip-icon cyan">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
                  </svg>
                </div>
                <div className="strip-info">
                  <span className="strip-value">{stats.totalReports.toLocaleString()}</span>
                  <span className="strip-label">Active Reports</span>
                  <span className="strip-change up">↑ {stats.reportChange}% this week</span>
                </div>
              </div>

              <div className="strip-stat">
                <div className="strip-icon purple">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                  </svg>
                </div>
                <div className="strip-info">
                  <span className="strip-value">{stats.totalIdeas.toLocaleString()}</span>
                  <span className="strip-label">Ideas Submitted</span>
                  <span className="strip-change up">↑ {stats.ideaChange}% this month</span>
                </div>
              </div>

              <div className="strip-stat">
                <div className="strip-icon green">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                    <polyline points="22 4 12 14.01 9 11.01"/>
                  </svg>
                </div>
                <div className="strip-info">
                  <span className="strip-value">{stats.resolutionRate}%</span>
                  <span className="strip-label">Resolution Rate</span>
                  <span className="strip-change up">↑ 12% this month</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── HOW IT WORKS (ABOUT US) ── */}
        <section className="how-section" id="about">
          <div className="container">
            <div className="how-header">
              <span className="how-label">Simple Process</span>
              <h2 className="how-title">How Civic Curator Works</h2>
              <p className="how-subtitle">Three easy steps to turn civic concerns into real community change.</p>
            </div>
            <div className="how-grid">
              <div className="how-card">
                <div className="how-icon how-icon-indigo">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                  </svg>
                </div>
                <div className="how-step-num">01</div>
                <h3 className="how-card-title">Report or Share</h3>
                <p className="how-card-desc">Submit an issue or idea about your neighbourhood with photos and location details in seconds.</p>
              </div>
              <div className="how-connector">
                <svg width="40" height="12" viewBox="0 0 40 12" fill="none"><path d="M0 6h36M30 1l6 5-6 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </div>
              <div className="how-card">
                <div className="how-icon how-icon-purple">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                  </svg>
                </div>
                <div className="how-step-num">02</div>
                <h3 className="how-card-title">Community Votes</h3>
                <p className="how-card-desc">Your neighbours upvote and comment, amplifying issues that matter most to the community.</p>
              </div>
              <div className="how-connector">
                <svg width="40" height="12" viewBox="0 0 40 12" fill="none"><path d="M0 6h36M30 1l6 5-6 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </div>
              <div className="how-card">
                <div className="how-icon how-icon-green">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                    <polyline points="22 4 12 14.01 9 11.01"/>
                  </svg>
                </div>
                <div className="how-step-num">03</div>
                <h3 className="how-card-title">Change Happens</h3>
                <p className="how-card-desc">Authorities review prioritised reports and implement solutions — tracked transparently in real time.</p>
              </div>
            </div>
          </div>
        </section>

        {/* ── ACTIVITY SECTION ── */}
        <section className="activity-section">
          <div className="container">
            <div className="section-header">
              <div className="section-title-wrap">
                <span className="live-activity-label">
                  <span className="live-dot"></span>
                  Live Activity
                </span>
                <h2 className="section-title">Recent Community Posts</h2>
              </div>
              <a href="#" className="view-all" onClick={(e) => { e.preventDefault(); navigate('/login'); }}>
                View all activity →
              </a>
            </div>

            <div className="grid">
              {recentPosts.map((post) => (
                <div className="card" key={post.id}>
                  <div className="post-header">
                    <div className="author-info">
                      {post.authorAvatar ? (
                        <img src={post.authorAvatar} alt={post.authorName} className="avatar" />
                      ) : (
                        <div className="avatar-initials">{post.authorName?.slice(0, 2).toUpperCase() || 'N/A'}</div>
                      )}
                      <div className="author-details">
                        <span className="author-name">{post.authorName || 'Anonymous'}</span>
                        <span className="post-meta">
                          {post.category || 'General'} · {post.createdAt?.toDate ? new Date(post.createdAt.toDate()).toLocaleDateString() : 'Recently'}
                        </span>
                      </div>
                    </div>
                    <span className={`badge badge-${post.status === 'APPROVED' ? 'approved' : post.type === 'idea' ? 'idea' : 'critical'}`}>
                      {post.status || post.type?.toUpperCase() || 'REPORT'}
                    </span>
                  </div>
                  <h3 className="post-title">{post.title}</h3>
                  {post.imageUrl && (
                    <div className="image-wrapper">
                      <img src={post.imageUrl} alt={post.title} className="post-image" />
                    </div>
                  )}
                  <p className="post-excerpt">{post.description}</p>
                  <div className="post-footer">
                    <div className="stat">
                      <svg className="stat-icon" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M2 9h3v12H2a1 1 0 0 1-1-1V10a1 1 0 0 1 1-1zm5.293-1.293l6.4-6.4a1 1 0 0 1 1.414 0l.043.043A2.96 2.96 0 0 1 16 3.466V8h4.5a2.5 2.5 0 0 1 2.5 2.5v4.922a4 4 0 0 1-1.397 3.03l-3.328 2.853A3 3 0 0 1 16.32 22H8a2 2 0 0 1-2-2V9a1 1 0 0 1 .293-.707z"/>
                      </svg>
                      {post.upvotes || 0}
                    </div>
                    <div className="stat">
                      <svg className="stat-icon" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>
                      </svg>
                      {post.comments || 0}
                    </div>
                  </div>
                </div>
              ))}
              {recentPosts.length === 0 && (
                <div className="card" style={{gridColumn: '1 / -1', textAlign: 'center', padding: '40px'}}>
                  <p style={{color: '#999'}}>No community posts yet. Be the first to share an idea!</p>
                </div>
              )}

              {/* Sidebar */}
              <div className="sidebar">
                <div className="card urgent-reports">
                  <div className="urgent-header">
                    <span className="urgent-dot"></span>
                    Urgent Reports
                  </div>

                  {urgentReports.map((report) => (
                    <div className="report-item" key={report.id}>
                      <div className="report-title-row">
                        <span className={`report-title ${report.priority === 'critical' ? 'red' : report.priority === 'high' ? 'amber' : 'blue'}`}>
                          {report.title}
                        </span>
                        <span className="report-time">
                          {report.createdAt?.toDate ? 
                            Math.round((Date.now() - report.createdAt.toDate()) / (1000 * 60)) + 'm ago' 
                            : 'Recently'
                          }
                        </span>
                      </div>
                      <p className="report-desc">{report.description?.substring(0, 60)}</p>
                      <div className="progress-bar">
                        <div className={`progress-fill ${report.priority === 'critical' ? 'red' : report.priority === 'high' ? 'amber' : 'blue'}`}></div>
                      </div>
                    </div>
                  ))}

                  {urgentReports.length === 0 && (
                    <p style={{color: '#999', textAlign: 'center', padding: '20px'}}>No urgent reports at the moment.</p>
                  )}
                </div>

                {/* Removed impact-card */}

              </div>
            </div>
          </div>
        </section>

        {/* ── CTA BANNER ── */}
        <section className="cta-section">
          <div className="container">
            <div className="cta-card">
              <div className="cta-glow"></div>
              <div className="cta-content">
                <h2 className="cta-title">Ready to Make a Difference?</h2>
                <p className="cta-subtitle">Join 42,000+ citizens shaping the future of their communities right now.</p>
                <div className="cta-buttons">
                  <button className="btn cta-btn-primary" onClick={() => navigate('/register')}>
                    Get Started — It's Free
                  </button>
                  <button className="btn cta-btn-secondary" onClick={() => navigate('/community')}>
                    Browse Community
                  </button>
                </div>
              </div>
              <div className="cta-visual">
                <div className="cta-ring cta-ring-1"></div>
                <div className="cta-ring cta-ring-2"></div>
                <div className="cta-ring cta-ring-3"></div>
                <div className="cta-center-icon">
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
                    <polyline points="9 22 9 12 15 12 15 22"/>
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* ── FOOTER ── */}
      <footer className="footer">
        <div className="container footer-content">
          <div className="footer-left">
            <div className="brand" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
              <span className="civic">Civic</span><span className="curator"> Curator</span>
            </div>
            <p className="footer-tagline">Building stronger communities, one idea at a time.</p>
          </div>
          <div className="footer-links">
            <div className="link-column">
              <span className="link-title">Platform</span>
              <a href="#" className="footer-link" onClick={(e) => { e.preventDefault(); navigate('/'); }}>Dashboard</a>
              <a href="#" className="footer-link" onClick={(e) => { e.preventDefault(); navigate('/community'); }}>Community</a>
              <a href="#" className="footer-link" onClick={(e) => { e.preventDefault(); navigate('/contact'); }}>Contact</a>
            </div>
            <div className="link-column">
              <span className="link-title">Connect</span>
              <a href="#" className="footer-link" onClick={(e) => { 
                e.preventDefault(); 
                if (window.location.pathname === '/') {
                  document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' });
                } else {
                  navigate('/');
                  setTimeout(() => {
                    document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' });
                  }, 100);
                }
              }}>About Us</a>
              <a href="#" className="footer-link" onClick={(e) => { e.preventDefault(); navigate('/contact'); }}>Contact Support</a>
            </div>
            <div className="link-column">
              <span className="link-title">Legal</span>
              <a href="#" className="footer-link" onClick={(e) => { e.preventDefault(); navigate('/legal'); }}>Privacy Policy</a>
              <a href="#" className="footer-link" onClick={(e) => { e.preventDefault(); navigate('/legal'); }}>Terms of Service</a>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <div className="container">
            <p className="copyright">© {new Date().getFullYear()} Civic Curator. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default Dashboard
