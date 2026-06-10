import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from './firebase';
import { signOut, onAuthStateChanged } from 'firebase/auth';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import './UserDashboard.css';

export default function UserDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [ideas, setIdeas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');

  // ── Track authentication and load user data ──
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        navigate('/login');
        return;
      }

      setUser(currentUser);

      try {
        // 1. Load user profile from Firestore
        const userDocRef = doc(db, 'users', currentUser.uid);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
          setUserProfile(userDocSnap.data());
        }

        // 2. Load user's submitted ideas/reports
        const ideasQuery = query(
          collection(db, 'reports'),
          where('authorId', '==', currentUser.uid)
        );
        const querySnapshot = await getDocs(ideasQuery);
        const ideasList = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));
        setIdeas(ideasList.sort((a, b) => {
          // Sort by creation date, newest first
          return (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0);
        }));

        setLoading(false);
      } catch (error) {
        console.error('Error loading user data:', error);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  // ── Filter ideas based on tab ──
  const filteredIdeas = ideas.filter(idea => {
    if (activeTab === 'pending') return idea.status === 'PENDING';
    if (activeTab === 'approved') return idea.status === 'APPROVED';
    if (activeTab === 'rejected') return idea.status === 'REJECTED';
    return true; // 'all' tab
  });

  // ── Handle logout ──
  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // ── Get status badge styling ──
  const getStatusStyle = (status) => {
    switch (status) {
      case 'PENDING':
        return { bg: 'rgba(245, 158, 11, 0.12)', color: '#f59e0b', border: 'rgba(245, 158, 11, 0.3)', icon: '⏳' };
      case 'APPROVED':
        return { bg: 'rgba(34, 197, 94, 0.12)', color: '#22c55e', border: 'rgba(34, 197, 94, 0.3)', icon: '✓' };
      case 'REJECTED':
        return { bg: 'rgba(239, 68, 68, 0.12)', color: '#ef4444', border: 'rgba(239, 68, 68, 0.3)', icon: '✕' };
      default:
        return { bg: 'rgba(107, 114, 128, 0.12)', color: '#6b7280', border: 'rgba(107, 114, 128, 0.3)', icon: '○' };
    }
  };

  if (loading) {
    return (
      <div className="user-dashboard">
        <nav className="ud-navbar">
          <div className="container ud-nav-content">
            <div className="ud-nav-left">
              <div className="ud-brand" onClick={() => navigate('/')}>
                <span className="ud-civic">Civic</span><span className="ud-curator"> Curator</span>
              </div>
            </div>
          </div>
        </nav>
        <div className="ud-loading">
          <div className="ud-spinner"></div>
          <p>Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="user-dashboard">
      {/* ── NAVBAR ── */}
      <nav className="ud-navbar">
        <div className="container ud-nav-content">
          <div className="ud-nav-left">
            <div className="ud-brand" onClick={() => navigate('/')}>
              <span className="ud-civic">Civic</span><span className="ud-curator"> Curator</span>
            </div>
            <div className="ud-nav-links">
              <span className="ud-nav-link active">Dashboard</span>
              <span className="ud-nav-link" onClick={() => navigate('/community')}>Community</span>
              <span className="ud-nav-link" onClick={() => navigate('/contact')}>Contact</span>
            </div>
          </div>
          <div className="ud-nav-right">
            <div className="ud-search-container">
              <svg className="ud-search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <input type="text" className="ud-search-input" placeholder="Search your ideas..." />
            </div>
            <button className="ud-btn-logout" onClick={handleLogout}>Logout</button>
          </div>
        </div>
      </nav>

      {/* ── MAIN CONTENT ── */}
      <main className="ud-main">
        <div className="container ud-container">
          {/* ── PROFILE SECTION ── */}
          <section className="ud-profile-section">
            <div className="ud-profile-card">
              <div className="ud-profile-header">
                <div className="ud-profile-pic-wrapper">
                  {userProfile?.profilePicUrl || user?.photoURL ? (
                    <img
                      src={userProfile?.profilePicUrl || user?.photoURL}
                      alt={userProfile?.fullName || user?.displayName}
                      className="ud-profile-pic"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextElementSibling.style.display = 'flex';
                      }}
                    />
                  ) : null}
                  <div className="ud-profile-pic-placeholder" style={{display: userProfile?.profilePicUrl || user?.photoURL ? 'none' : 'flex'}}>
                    {userProfile?.fullName?.charAt(0).toUpperCase() || user?.displayName?.charAt(0).toUpperCase() || '?'}
                  </div>
                </div>
                <div className="ud-profile-info">
                  <h1 className="ud-profile-name">{userProfile?.fullName || 'User'}</h1>
                  <p className="ud-profile-username">@{userProfile?.username || 'username'}</p>
                  <div className="ud-profile-role-badge">{userProfile?.role || 'Citizen'}</div>
                </div>
              </div>

              <div className="ud-profile-details">
                <div className="ud-detail-item">
                  <span className="ud-detail-label">Email</span>
                  <span className="ud-detail-value">{user?.email}</span>
                </div>
                {userProfile?.phone && (
                  <div className="ud-detail-item">
                    <span className="ud-detail-label">Phone</span>
                    <span className="ud-detail-value">{userProfile.phone}</span>
                  </div>
                )}
                <div className="ud-detail-item">
                  <span className="ud-detail-label">Member Since</span>
                  <span className="ud-detail-value">
                    {userProfile?.createdAt
                      ? new Date(userProfile.createdAt.toMillis()).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })
                      : 'Recently'}
                  </span>
                </div>
              </div>

              <button className="ud-btn-new-idea" onClick={() => navigate('/submit')}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
                Submit New Idea
              </button>
            </div>

            {/* ── STATS ── */}
            <div className="ud-stats-grid">
              <div className="ud-stat-card">
                <div className="ud-stat-icon" style={{ background: 'rgba(59, 130, 246, 0.1)' }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                  </svg>
                </div>
                <div className="ud-stat-info">
                  <div className="ud-stat-value">{ideas.length}</div>
                  <div className="ud-stat-label">Total Submissions</div>
                </div>
              </div>

              <div className="ud-stat-card">
                <div className="ud-stat-icon" style={{ background: 'rgba(34, 197, 94, 0.1)' }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="22 4 12 14.01 9 11.01"/>
                  </svg>
                </div>
                <div className="ud-stat-info">
                  <div className="ud-stat-value">{ideas.filter(i => i.status === 'APPROVED').length}</div>
                  <div className="ud-stat-label">Approved</div>
                </div>
              </div>

              <div className="ud-stat-card">
                <div className="ud-stat-icon" style={{ background: 'rgba(245, 158, 11, 0.1)' }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                  </svg>
                </div>
                <div className="ud-stat-info">
                  <div className="ud-stat-value">{ideas.filter(i => i.status === 'PENDING').length}</div>
                  <div className="ud-stat-label">Pending Review</div>
                </div>
              </div>

              <div className="ud-stat-card">
                <div className="ud-stat-icon" style={{ background: 'rgba(239, 68, 68, 0.1)' }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
                  </svg>
                </div>
                <div className="ud-stat-info">
                  <div className="ud-stat-value">{ideas.filter(i => i.status === 'REJECTED').length}</div>
                  <div className="ud-stat-label">Not Approved</div>
                </div>
              </div>
            </div>
          </section>

          {/* ── IDEAS SECTION ── */}
          <section className="ud-ideas-section">
            <div className="ud-section-header">
              <h2 className="ud-section-title">Your Submissions</h2>
              <div className="ud-filter-tabs">
                <button
                  className={`ud-filter-tab ${activeTab === 'all' ? 'active' : ''}`}
                  onClick={() => setActiveTab('all')}
                >
                  All ({ideas.length})
                </button>
                <button
                  className={`ud-filter-tab ${activeTab === 'pending' ? 'active' : ''}`}
                  onClick={() => setActiveTab('pending')}
                >
                  Pending ({ideas.filter(i => i.status === 'PENDING').length})
                </button>
                <button
                  className={`ud-filter-tab ${activeTab === 'approved' ? 'active' : ''}`}
                  onClick={() => setActiveTab('approved')}
                >
                  Approved ({ideas.filter(i => i.status === 'APPROVED').length})
                </button>
                <button
                  className={`ud-filter-tab ${activeTab === 'rejected' ? 'active' : ''}`}
                  onClick={() => setActiveTab('rejected')}
                >
                  Not Approved ({ideas.filter(i => i.status === 'REJECTED').length})
                </button>
              </div>
            </div>

            {filteredIdeas.length === 0 ? (
              <div className="ud-empty-state">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                </svg>
                <h3>No submissions yet</h3>
                <p>
                  {activeTab === 'all'
                    ? "You haven't submitted any ideas yet. Click 'Submit New Idea' to get started!"
                    : `You don't have any ${activeTab} submissions.`}
                </p>
                <button className="ud-btn-primary" onClick={() => navigate('/submit')}>
                  Submit Your First Idea
                </button>
              </div>
            ) : (
              <div className="ud-ideas-grid">
                {filteredIdeas.map(idea => {
                  const statusStyle = getStatusStyle(idea.status);
                  const categoryColors = {
                    infrastructure: '#f59e0b',
                    parks: '#22c55e',
                    transportation: '#06b6d4',
                    environment: '#10b981',
                    safety: '#ef4444',
                    arts: '#a855f7',
                  };

                  return (
                    <div key={idea.id} className="ud-idea-card">
                      {/* Card Header */}
                      <div className="ud-idea-header">
                        <div className="ud-idea-meta">
                          <span className="ud-idea-category" style={{ backgroundColor: `${categoryColors[idea.category] || '#6b7280'}20`, color: categoryColors[idea.category] || '#6b7280' }}>
                            {idea.category?.charAt(0).toUpperCase() + idea.category?.slice(1)}
                          </span>
                          <span
                            className="ud-idea-urgency"
                            style={{
                              backgroundColor: idea.urgency === 'Critical' ? 'rgba(239, 68, 68, 0.12)' : idea.urgency === 'High' ? 'rgba(245, 158, 11, 0.12)' : 'rgba(34, 197, 94, 0.12)',
                              color: idea.urgency === 'Critical' ? '#ef4444' : idea.urgency === 'High' ? '#f59e0b' : '#22c55e',
                              border: idea.urgency === 'Critical' ? '1px solid rgba(239, 68, 68, 0.3)' : idea.urgency === 'High' ? '1px solid rgba(245, 158, 11, 0.3)' : '1px solid rgba(34, 197, 94, 0.3)',
                            }}
                          >
                            {idea.urgency === 'Critical' ? '🔴' : idea.urgency === 'High' ? '🟡' : '🟢'} {idea.urgency}
                          </span>
                        </div>
                        <span
                          className="ud-status-badge"
                          style={{
                            backgroundColor: statusStyle.bg,
                            color: statusStyle.color,
                            border: `1px solid ${statusStyle.border}`,
                          }}
                        >
                          {statusStyle.icon} {idea.status}
                        </span>
                      </div>

                      {/* Card Images */}
                      {idea.imageUrls && idea.imageUrls.length > 0 && (
                        <div className="ud-idea-images">
                          {idea.imageUrls.slice(0, 2).map((url, idx) => (
                            <img key={idx} src={url} alt={`Idea ${idx + 1}`} className="ud-idea-image" />
                          ))}
                          {idea.imageUrls.length > 2 && <div className="ud-image-more">+{idea.imageUrls.length - 2}</div>}
                        </div>
                      )}

                      {/* Card Content */}
                      <div className="ud-idea-content">
                        <h3 className="ud-idea-title">{idea.title}</h3>
                        <p className="ud-idea-description">{idea.description.substring(0, 100)}...</p>
                        <div className="ud-idea-stats">
                          <span className="ud-idea-upvotes">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                            </svg>
                            {idea.upvotes || 0} Upvotes
                          </span>
                          <span className="ud-idea-date">
                            {idea.createdAt
                              ? new Date(idea.createdAt.toMillis()).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric',
                                })
                              : 'Recently'}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
