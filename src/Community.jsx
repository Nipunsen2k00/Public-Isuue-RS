import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, onSnapshot, doc, updateDoc, increment, addDoc, getDocs, orderBy, serverTimestamp } from 'firebase/firestore';
import { db, auth } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';
import './Community.css';

const CAT_TAG_CLASS = {
  infrastructure: 'tag-blue',
  transportation: 'tag-blue',
  parks:          'tag-orange',
  environment:    'tag-orange',
  arts:           'tag-purple',
  safety:         'tag-purple',
};

const categories = ['All', 'Infrastructure', 'Environment', 'Arts & Culture', 'Public Safety', 'Parks', 'Transportation'];

export default function Community() {
  const navigate = useNavigate();
  const [activeFilter, setActiveFilter] = useState('All');
  const [searchQuery,  setSearchQuery]  = useState('');
  const [feed,         setFeed]         = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [feedError,    setFeedError]    = useState('');
  const [user,         setUser]         = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [commentsModal, setCommentsModal] = useState(null);
  const [commentText, setCommentText] = useState('');
  const [comments, setComments] = useState([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [commentSubmitting, setCommentSubmitting] = useState(false);
  const [commentSubmitError, setCommentSubmitError] = useState('');

  /* ── Check Auth State ── */
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsub();
  }, []);

  /* ── Live feed: only APPROVED reports ── */
  useEffect(() => {
    // Simple query — no composite index needed
    const q = query(
      collection(db, 'reports'),
      where('status', '==', 'APPROVED')
    );
    const unsub = onSnapshot(q, (snap) => {
      const items = snap.docs.map(d => ({
        id:       d.id,
        ...d.data(),
        tag:      (d.data().category || 'other').toUpperCase(),
        tagClass: CAT_TAG_CLASS[d.data().category] || 'tag-blue',
        excerpt:  d.data().description || '',
        upvotes:  d.data().upvotes     || 0,
        downvotes: d.data().downvotes || 0,
        comments: d.data().comments    || 0,
        // Sort by createdAt client-side (newest first)
        _ts:      d.data().createdAt?.toDate?.()?.getTime() || 0,
        time:     d.data().createdAt?.toDate ? timeAgo(d.data().createdAt.toDate()) : 'Just now',
        // Use first uploaded image if exists, else category stock photo
        image:    (d.data().imageUrls && d.data().imageUrls.length > 0)
                    ? d.data().imageUrls[0]
                    : categoryImage(d.data().category),
        imageUrls: d.data().imageUrls || [],
      }));
      // Sort newest first client-side
      items.sort((a, b) => b._ts - a._ts);
      setFeed(items);
      setFeedError('');
      setLoading(false);
    }, (err) => {
      console.error('Community feed error:', err);
      setFeedError(err.message || 'Failed to load feed.');
      setLoading(false);
    });
    return () => unsub();
  }, []);


  /* ── Upvote (write back to Firestore) ── */
  const handleUpvote = async (id) => {
    setFeed(prev => prev.map(item => item.id === id ? { ...item, upvotes: item.upvotes + 1 } : item));
    try {
      await updateDoc(doc(db, 'reports', id), { upvotes: increment(1) });
    } catch (err) {
      console.error('Upvote error:', err);
    }
  };

  /* ── Downvote ── */
  const handleDownvote = async (id) => {
    setFeed(prev => prev.map(item => item.id === id ? { ...item, downvotes: item.downvotes + 1 } : item));
    try {
      await updateDoc(doc(db, 'reports', id), { downvotes: increment(1) });
    } catch (err) {
      console.error('Downvote error:', err);
    }
  };

  /* ── Load comments ── */
  const loadComments = async (reportId) => {
    setLoadingComments(true);
    try {
      const commentsQuery = query(
        collection(db, 'reports', reportId, 'comments'),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(commentsQuery);
      const commentsData = snapshot.docs.map(d => ({
        id: d.id,
        ...d.data(),
        createdAt: d.data().createdAt?.toDate?.() || new Date()
      }));
      setComments(commentsData);
    } catch (err) {
      console.error('Error loading comments:', err);
      setComments([]);
    }
    setLoadingComments(false);
  };

  /* ── Open comments modal ── */
  const handleCommentClick = (item) => {
    if (!user) {
      alert('Please log in to view comments');
      return;
    }
    setCommentsModal(item);
    loadComments(item.id);
    setCommentText('');
  };

  /* ── Add comment ── */
  const handleAddComment = async () => {
    setCommentSubmitError('');
    const text = (commentText || '').trim();
    if (!text) {
      setCommentSubmitError('Comment cannot be empty.');
      return;
    }
    if (!commentsModal) {
      setCommentSubmitError('No report selected.');
      return;
    }
    if (!user) {
      setCommentSubmitError('You must be logged in to post comments.');
      return;
    }
    if (text.length < 2) {
      setCommentSubmitError('Comment is too short.');
      return;
    }
    if (text.length > 2000) {
      setCommentSubmitError('Comment is too long.');
      return;
    }

    setCommentSubmitting(true);
    try {
      const payload = {
        authorName: user.displayName || user.email || 'Anonymous',
        authorId: user.uid,
        authorPhoto: user.photoURL || '',
        text,
        createdAt: serverTimestamp()
      };
      console.debug('Posting comment', { reportId: commentsModal.id, payload });

      const colRef = collection(db, 'reports', commentsModal.id, 'comments');
      const docRef = await addDoc(colRef, payload);
      console.debug('Comment created:', docRef.id);

      // Update comment count on parent report
      try {
        await updateDoc(doc(db, 'reports', commentsModal.id), { comments: increment(1) });
      } catch (upErr) {
        console.error('Failed to increment comment count:', upErr);
        // Don't treat this as fatal for the user — continue to reload comments
      }

      // Reload comments and reset
      await loadComments(commentsModal.id);
      setCommentText('');
      setCommentSubmitError('');
    } catch (err) {
      console.error('Error adding comment:', err);
      // Show a more meaningful error message when available
      const message = (err && err.message) ? err.message : 'Failed to add comment due to network or permissions error.';
      setCommentSubmitError(message);
    } finally {
      setCommentSubmitting(false);
    }
  };

  const handleShare = () => {
    navigator.clipboard?.writeText(window.location.href);
    alert('Link copied to clipboard!');
  };
  const handleBell = () => alert('No new notifications.');

  const filteredFeed = feed.filter(item => {
    const matchFilter = activeFilter === 'All' ||
      item.tag.toLowerCase().includes(activeFilter.toLowerCase());
    const matchSearch =
      item.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.excerpt?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchFilter && matchSearch;
  });

  return (
    <div className="community-page">

      {/* ── DARK NAVBAR ── */}
      <nav className="navbar">
        <div className="nav-content">
          <div className="nav-left">
            <div className="brand" onClick={() => navigate('/')} style={{cursor:'pointer'}}>
              <span className="civic">Civic</span>
              <span className="curator"> Curator</span>
            </div>
            <div className={`nav-links ${mobileMenuOpen ? 'mobile-open' : ''}`}>
              <span className="nav-link" onClick={() => { navigate('/'); setMobileMenuOpen(false); }}>Dashboard</span>
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
              }}>About</span>
              <span className="nav-link community-active">Community</span>
              <span className="nav-link" onClick={() => { navigate('/contact'); setMobileMenuOpen(false); }}>Contact</span>
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
              <input type="text" className="community-search" placeholder="Search discussions..."
                value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                onKeyPress={e => e.key === 'Enter' && setSearchQuery(searchQuery)}/>
              <button className="search-button" title="Search" aria-label="Search" onClick={() => setSearchQuery(searchQuery)}>
                <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
              </button>
            </div>
            <svg className="bell-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
              strokeLinecap="round" strokeLinejoin="round"
              style={{width:22,height:22,cursor:'pointer'}} onClick={handleBell}>
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
            </svg>
            {user ? (
              <img
                src={user.photoURL || "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=100&auto=format&fit=crop"}
                alt="Profile"
                className="profile-pic"
                style={{width:38,height:38,borderRadius:'50%',cursor:'pointer',objectFit:'cover'}}
                onClick={() => navigate('/user-dashboard')}
              />
            ) : (
              <div className="nav-right-buttons">
                <button className="nav-btn-login" onClick={() => navigate('/login')}>Log In</button>
                <button className="nav-btn-signup" onClick={() => navigate('/register')}>Sign Up</button>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* ── HERO BANNER ── */}
      <div className="community-hero">
        <div className="community-hero-inner">
          <div className="community-hero-text">
            <div className="community-hero-eyebrow">
              <span className="hero-live-dot"/>
              Live Community Feed
            </div>
            <h1 className="community-hero-title">
              Your City,<br/><span>Your Voice.</span>
            </h1>
            <p className="community-hero-sub">
              Discover admin-approved local initiatives, join conversations, and help shape the future of your shared spaces.
            </p>
          </div>
          <div className="community-hero-stats">
            <div className="ch-stat">
              <div className="ch-stat-val">{feed.length}</div>
              <div className="ch-stat-lbl">Approved Initiatives</div>
            </div>
            <div className="ch-stat">
              <div className="ch-stat-val">42K+</div>
              <div className="ch-stat-lbl">Community Members</div>
            </div>
            <div className="ch-stat">
              <div className="ch-stat-val">84%</div>
              <div className="ch-stat-lbl">Issues Resolved</div>
            </div>
          </div>
        </div>
      </div>

      {/* ── MAIN FEED ── */}
      <main className="community-main">
        <div className="community-container">

          <div className="feed-header">
            <div className="feed-header-top">
              <h2 className="feed-title">Approved Initiatives</h2>
              <span className="feed-count">{filteredFeed.length} result{filteredFeed.length !== 1 ? 's' : ''}</span>
            </div>
            <div className="feed-filters">
              {categories.map(cat => (
                <button key={cat}
                  className={`filter-pill ${activeFilter === cat ? 'active' : ''}`}
                  onClick={() => setActiveFilter(cat)}>
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="feed-list">
            {/* Error state */}
            {feedError && (
              <div className="empty-state" style={{color:'#ef4444'}}>
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                <h3 style={{color:'#ef4444'}}>Could not load feed</h3>
                <p style={{color:'rgba(15, 23, 42, 0.6)',fontSize:'0.85rem'}}>{feedError}</p>
              </div>
            )}

            {/* Loading state */}
            {loading && (
              <div className="community-loading">
                <div className="comm-spinner"/>
                <p>Loading approved initiatives…</p>
              </div>
            )}

            {/* Live feed cards */}
            {!loading && filteredFeed.map(item => (
              <article className="feed-card" key={item.id}>
                <div className="feed-card-content">
                  <div className="feed-card-meta">
                    <span className={`card-tag ${item.tagClass}`}>{item.tag}</span>
                    <span className="comm-author-tag">by {item.authorName || 'Community Member'}</span>
                    <span className="card-time">· {item.time}</span>
                  </div>
                  <h2 className="feed-card-title">{item.title}</h2>
                  <p className="feed-card-excerpt">{item.excerpt}</p>
                  <div className="feed-card-actions">
                    <div className="action-left">
                      <button className="action-btn" onClick={() => handleUpvote(item.id)} title="Like">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                        </svg>
                        {item.upvotes}
                      </button>
                      <button className="action-btn" onClick={() => handleDownvote(item.id)} title="Dislike">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style={{transform: 'scaleY(-1)'}}>
                          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                        </svg>
                        {item.downvotes}
                      </button>
                      <button className="action-btn" onClick={() => handleCommentClick(item)} title="Comment">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>
                        </svg>
                        {item.comments}
                      </button>
                    </div>
                    <button className="action-btn share-btn" onClick={handleShare}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
                        <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
                      </svg>
                    </button>
                  </div>
                </div>
                <div className="feed-card-image">
                  <img src={item.image} alt={item.title}
                    onError={e => { e.target.src = categoryImageFallback(item.tag); }}
                  />
                  {item.imageUrls.length > 1 && (
                    <div className="feed-img-count">+{item.imageUrls.length - 1} more</div>
                  )}
                </div>
              </article>
            ))}

            {/* Empty state */}
            {!loading && filteredFeed.length === 0 && (
              <div className="empty-state">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
                <h3>{searchQuery ? 'No matching initiatives' : 'No approved initiatives yet'}</h3>
                <p>{searchQuery ? 'Try a different search term.' : 'Submit an idea and wait for admin approval!'}</p>
                <button className="filter-pill active" style={{marginTop:16}} onClick={() => navigate('/submit')}>
                  Submit an Idea →
                </button>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* ── COMMENTS MODAL ── */}
      {commentsModal && (
        <div className="modal-overlay" onClick={() => setCommentsModal(null)}>
          <div className="comments-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Comments on "{commentsModal.title}"</h2>
              <button className="modal-close" onClick={() => setCommentsModal(null)}>✕</button>
            </div>

            <div className="comments-list">
              {loadingComments ? (
                <p style={{textAlign:'center',color:'#999'}}>Loading comments...</p>
              ) : comments.length === 0 ? (
                <p style={{textAlign:'center',color:'#999'}}>No comments yet. Be the first!</p>
              ) : (
                comments.map(comment => (
                  <div className="comment-item" key={comment.id}>
                    <div className="comment-header">
                      <strong>{comment.authorName}</strong>
                      <span className="comment-time">{timeAgo(comment.createdAt)}</span>
                    </div>
                    <p className="comment-text">{comment.text}</p>
                  </div>
                ))
              )}
            </div>

            {user && (
              <div className="comment-input-section">
                <textarea
                  className="comment-input"
                  placeholder="Add your comment..."
                  value={commentText}
                  onChange={e => setCommentText(e.target.value)}
                  onKeyPress={e => e.key === 'Enter' && e.ctrlKey && handleAddComment()}
                />
                {commentSubmitError && (
                  <div style={{color:'#b42318',background:'#fff1f2',padding:'8px 12px',borderRadius:8,fontSize:14}}>{commentSubmitError}</div>
                )}
                <button className="comment-submit-btn" onClick={handleAddComment} disabled={commentSubmitting || !commentText.trim()}>
                  {commentSubmitting ? 'Posting…' : 'Post Comment'}
                </button>
              </div>
            )}
            {!user && (
              <div style={{padding:'12px',background:'#f0f0f0',borderRadius:'8px',textAlign:'center',color:'#666'}}>
                <p>Please <span style={{cursor:'pointer',color:'#6366f1'}} onClick={() => navigate('/login')}>log in</span> to comment</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── FAB ── */}
      <button className="fab-button" onClick={() => navigate('/submit')}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
        Post Update
      </button>
    </div>
  );
}

/* ── Helpers ── */
function timeAgo(date) {
  const secs = Math.floor((Date.now() - date.getTime()) / 1000);
  if (secs < 60)    return 'Just now';
  if (secs < 3600)  return `${Math.floor(secs/60)}m ago`;
  if (secs < 86400) return `${Math.floor(secs/3600)}h ago`;
  return `${Math.floor(secs/86400)}d ago`;
}

function categoryImage(cat) {
  const map = {
    infrastructure: 'https://images.unsplash.com/photo-1517462964-21fdcec3f25b?q=80&w=600&auto=format&fit=crop',
    parks:          'https://images.unsplash.com/photo-1530836369250-ef72a3f5cda8?q=80&w=600&auto=format&fit=crop',
    environment:    'https://images.unsplash.com/photo-1592424001844-3074da8cece3?q=80&w=600&auto=format&fit=crop',
    transportation: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?q=80&w=600&auto=format&fit=crop',
    safety:         'https://images.unsplash.com/photo-1542314831-c6a4d14d88e6?q=80&w=600&auto=format&fit=crop',
    arts:           'https://images.unsplash.com/photo-1561582236-8a0328a6fcf1?q=80&w=600&auto=format&fit=crop',
  };
  return map[cat] || 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=600&auto=format&fit=crop';
}

// Accepts the uppercase TAG stored in Firestore (e.g. "SAFETY", "INFRASTRUCTURE")
function categoryImageFallback(tag = '') {
  const t = tag.toLowerCase();
  if (t.includes('infra'))  return categoryImage('infrastructure');
  if (t.includes('park'))   return categoryImage('parks');
  if (t.includes('envir'))  return categoryImage('environment');
  if (t.includes('trans'))  return categoryImage('transportation');
  if (t.includes('safe'))   return categoryImage('safety');
  if (t.includes('art'))    return categoryImage('arts');
  return categoryImage('');
}

