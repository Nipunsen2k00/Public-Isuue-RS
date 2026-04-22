// src/Dashboard.jsx
import React from 'react'
import { useNavigate } from 'react-router-dom'
import './Dashboard.css'

function Dashboard() {
  const navigate = useNavigate()
  return (
    <div className="app-container">
      {/* ── NAVBAR ── */}
      <nav className="navbar">
        <div className="container nav-content">
          <div className="nav-left">
            <div className="brand" onClick={() => navigate('/')} style={{cursor:'pointer'}}>
              <span className="civic">Civic</span><span className="curator"> Curator</span>
            </div>
            <div className="nav-links">
              <span className="nav-link active" style={{cursor:'pointer'}}>Dashboard</span>
              <span className="nav-link" onClick={() => navigate('/community')} style={{cursor:'pointer'}}>Community</span>
              <span className="nav-link" style={{cursor:'pointer'}}>Impact</span>
            </div>
          </div>
          <div className="nav-right">
            <div className="search-container">
              <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <input type="text" className="search-input" placeholder="Search initiatives..." />
            </div>
            <button className="btn-nav-login" onClick={() => navigate('/login')}>Login</button>
            <button className="btn-nav-register" onClick={() => navigate('/register')}>Register</button>
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
                  <span className="strip-value">42,819</span>
                  <span className="strip-label">Active Citizens</span>
                  <span className="strip-change up">↑ 18% this month</span>
                </div>
              </div>

              <div className="strip-stat">
                <div className="strip-icon cyan">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
                  </svg>
                </div>
                <div className="strip-info">
                  <span className="strip-value">3,547</span>
                  <span className="strip-label">Active Reports</span>
                  <span className="strip-change up">↑ 7% this week</span>
                </div>
              </div>

              <div className="strip-stat">
                <div className="strip-icon purple">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                  </svg>
                </div>
                <div className="strip-info">
                  <span className="strip-value">1,284</span>
                  <span className="strip-label">Ideas Submitted</span>
                  <span className="strip-change up">↑ 24% this month</span>
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
                  <span className="strip-value">84.2%</span>
                  <span className="strip-label">Resolution Rate</span>
                  <span className="strip-change up">↑ 12% this month</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── HOW IT WORKS ── */}
        <section className="how-section">
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
              {/* Card 1 */}
              <div className="card">
                <div className="post-header">
                  <div className="author-info">
                    <img src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=100&auto=format&fit=crop" alt="Marcus Chen" className="avatar" />
                    <div className="author-details">
                      <span className="author-name">Marcus Chen</span>
                      <span className="post-meta">Infrastructure · 2h ago</span>
                    </div>
                  </div>
                  <span className="badge badge-critical">CRITICAL</span>
                </div>
                <h3 className="post-title">Proposed: Revitalization of the 4th Street Plaza</h3>
                <div className="image-wrapper">
                  <img src="https://images.unsplash.com/photo-1517462964-21fdcec3f25b?q=80&w=600&auto=format&fit=crop" alt="Plaza" className="post-image" />
                </div>
                <p className="post-excerpt">
                  The current state of the 4th Street Plaza doesn't reflect our community's vibrancy. A full redesign could attract local businesses and green spaces...
                </p>
                <div className="post-footer">
                  <div className="stat">
                    <svg className="stat-icon" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M2 9h3v12H2a1 1 0 0 1-1-1V10a1 1 0 0 1 1-1zm5.293-1.293l6.4-6.4a1 1 0 0 1 1.414 0l.043.043A2.96 2.96 0 0 1 16 3.466V8h4.5a2.5 2.5 0 0 1 2.5 2.5v4.922a4 4 0 0 1-1.397 3.03l-3.328 2.853A3 3 0 0 1 16.32 22H8a2 2 0 0 1-2-2V9a1 1 0 0 1 .293-.707z"/>
                    </svg>
                    124
                  </div>
                  <div className="stat">
                    <svg className="stat-icon" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>
                    </svg>
                    42
                  </div>
                  <div className="collaborators">
                    <div className="collab-circle">+38</div>
                  </div>
                </div>
              </div>

              {/* Card 2 */}
              <div className="card">
                <div className="post-header">
                  <div className="author-info">
                    <div className="avatar-initials">SL</div>
                    <div className="author-details">
                      <span className="author-name">Sarah Lopez</span>
                      <span className="post-meta">Parks · 5h ago</span>
                    </div>
                  </div>
                  <span className="badge badge-idea">IDEA</span>
                </div>
                <h3 className="post-title">New Community Garden in East District</h3>
                <div className="image-wrapper">
                  <img src="https://images.unsplash.com/photo-1530836369250-ef72a3f5cda8?q=80&w=600&auto=format&fit=crop" alt="Garden" className="post-image" />
                </div>
                <p className="post-excerpt">
                  We have a vacant lot that would be perfect for a community-led gardening project. Let's transform unused urban space into green community hubs...
                </p>
                <div className="post-footer">
                  <div className="stat">
                    <svg className="stat-icon" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M2 9h3v12H2a1 1 0 0 1-1-1V10a1 1 0 0 1 1-1zm5.293-1.293l6.4-6.4a1 1 0 0 1 1.414 0l.043.043A2.96 2.96 0 0 1 16 3.466V8h4.5a2.5 2.5 0 0 1 2.5 2.5v4.922a4 4 0 0 1-1.397 3.03l-3.328 2.853A3 3 0 0 1 16.32 22H8a2 2 0 0 1-2-2V9a1 1 0 0 1 .293-.707z"/>
                    </svg>
                    86
                  </div>
                  <div className="stat">
                    <svg className="stat-icon" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>
                    </svg>
                    12
                  </div>
                  <div className="collaborators">
                    <div className="collab-circle">+21</div>
                  </div>
                </div>
              </div>

              {/* Sidebar */}
              <div className="sidebar">
                <div className="card urgent-reports">
                  <div className="urgent-header">
                    <span className="urgent-dot"></span>
                    Urgent Reports
                  </div>

                  <div className="report-item">
                    <div className="report-title-row">
                      <span className="report-title red">Water Main Leak</span>
                      <span className="report-time">10m ago</span>
                    </div>
                    <p className="report-desc">Significant leakage on Elm Street intersection.</p>
                    <div className="progress-bar">
                      <div className="progress-fill red"></div>
                    </div>
                  </div>

                  <div className="report-item">
                    <div className="report-title-row">
                      <span className="report-title blue">Farmers Market Hub</span>
                      <span className="report-time">4h ago</span>
                    </div>
                    <p className="report-desc">Approved for weekend operations on 5th.</p>
                    <div className="progress-bar">
                      <div className="progress-fill blue"></div>
                    </div>
                  </div>

                  <div className="report-item">
                    <div className="report-title-row">
                      <span className="report-title amber">Street Light Outage</span>
                      <span className="report-time">1h ago</span>
                    </div>
                    <p className="report-desc">Multiple lights out on Oak Ave near school zone.</p>
                    <div className="progress-bar">
                      <div className="progress-fill amber"></div>
                    </div>
                  </div>
                </div>

                <div className="impact-card">
                  <div className="impact-header">Impact Score</div>
                  <svg className="trend-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/>
                    <polyline points="16 7 22 7 22 13"/>
                  </svg>
                  <div className="impact-score">84.2%</div>
                  <p className="impact-desc">Resolution rate up 12% this month.</p>
                  <div className="impact-sparkline">
                    <div className="spark-bar" style={{height:'30%'}}></div>
                    <div className="spark-bar" style={{height:'50%'}}></div>
                    <div className="spark-bar" style={{height:'40%'}}></div>
                    <div className="spark-bar" style={{height:'70%'}}></div>
                    <div className="spark-bar" style={{height:'55%'}}></div>
                    <div className="spark-bar" style={{height:'80%'}}></div>
                    <div className="spark-bar active" style={{height:'100%'}}></div>
                  </div>
                </div>
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
            <div className="brand">
              <span className="civic">Civic</span><span className="curator"> Curator</span>
            </div>
            <p className="footer-tagline">Building stronger communities, one idea at a time.</p>
          </div>
          <div className="footer-links">
            <div className="link-column">
              <span className="link-title">Platform</span>
              <a href="#" className="footer-link">Dashboard</a>
              <a href="#" className="footer-link">Community</a>
              <a href="#" className="footer-link">Impact Score</a>
            </div>
            <div className="link-column">
              <span className="link-title">Connect</span>
              <a href="#" className="footer-link">About Us</a>
              <a href="#" className="footer-link">Contact Support</a>
            </div>
            <div className="link-column">
              <span className="link-title">Legal</span>
              <a href="#" className="footer-link">Privacy Policy</a>
              <a href="#" className="footer-link">Terms of Service</a>
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
