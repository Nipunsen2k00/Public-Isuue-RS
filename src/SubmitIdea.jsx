// src/SubmitIdea.jsx
import React, { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { auth, db, storage } from './firebase';
import './SubmitIdea.css';


const CATEGORIES = [
  { val: 'infrastructure', label: 'Infrastructure',   emoji: '🏗️', color: '#f59e0b' },
  { val: 'parks',          label: 'Parks & Recreation',emoji: '🌳', color: '#22c55e' },
  { val: 'transportation', label: 'Transportation',    emoji: '🚌', color: '#06b6d4' },
  { val: 'environment',    label: 'Environment',       emoji: '🌿', color: '#10b981' },
  { val: 'safety',         label: 'Public Safety',     emoji: '🛡️', color: '#ef4444' },
  { val: 'arts',           label: 'Arts & Culture',    emoji: '🎨', color: '#a855f7' },
];

const URGENCY = [
  { val: 'Normal',   color: '#22c55e', bg: 'rgba(34,197,94,0.12)',   border: 'rgba(34,197,94,0.3)',   icon: '🟢' },
  { val: 'High',     color: '#f59e0b', bg: 'rgba(245,158,11,0.12)',  border: 'rgba(245,158,11,0.3)',  icon: '🟡' },
  { val: 'Critical', color: '#ef4444', bg: 'rgba(239,68,68,0.12)',   border: 'rgba(239,68,68,0.3)',   icon: '🔴' },
];

const MAX_CHARS = 800;

export default function SubmitIdea() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [urgency,      setUrgency]      = useState('High');
  const [title,        setTitle]        = useState('');
  const [category,     setCategory]     = useState('');
  const [description,  setDescription]  = useState('');
  const [files,        setFiles]        = useState([]);
  const [dragOver,     setDragOver]     = useState(false);
  const [submitted,    setSubmitted]    = useState(false);
  const [submitting,   setSubmitting]   = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');
  const [touched,      setTouched]      = useState({});

  /* ── helpers ── */
  const errors = {
    title:       !title.trim() ? 'A title is required' : '',
    category:    !category     ? 'Please pick a category' : '',
    description: description.trim().length < 20 ? 'Add at least 20 characters' : '',
  };
  const isValid = !errors.title && !errors.category && !errors.description;

  const touch = (f) => setTouched(t => ({ ...t, [f]: true }));

  /* ── file handling ── */
  const addFiles = useCallback((incoming) => {
    const arr = Array.from(incoming).filter(f => f.size <= 25 * 1024 * 1024);
    setFiles(prev => {
      const existing = new Set(prev.map(f => f.name + f.size));
      return [...prev, ...arr.filter(f => !existing.has(f.name + f.size))].slice(0, 6);
    });
  }, []);

  const handleDrop = (e) => {
    e.preventDefault(); setDragOver(false);
    addFiles(e.dataTransfer.files);
  };

  const removeFile = (idx) => setFiles(f => f.filter((_, i) => i !== idx));

  /* ── submit ── */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setTouched({ title: true, category: true, description: true });
    if (!isValid) return;
    setSubmitting(true);
    try {
      const user = auth.currentUser;
      const uid  = user ? user.uid : 'anonymous';

      // 1. Upload each image file to Firebase Storage
      const imageUrls = [];
      const imageFiles = files.filter(f => f.type.startsWith('image/'));
      for (let i = 0; i < imageFiles.length; i++) {
        const file = imageFiles[i];
        setUploadProgress(`Uploading image ${i + 1} of ${imageFiles.length}…`);
        const storageRef = ref(storage, `reports/${uid}/${Date.now()}_${file.name}`);
        const snap = await uploadBytes(storageRef, file);
        const url  = await getDownloadURL(snap.ref);
        imageUrls.push(url);
      }

      setUploadProgress('Saving report…');

      // 2. Save report doc to Firestore with image URLs
      await addDoc(collection(db, 'reports'), {
        title,
        category,
        urgency,
        description,
        imageUrls,                          // array of download URLs
        fileCount:   files.length,
        authorId:    uid,
        authorEmail: user ? user.email      : 'anonymous',
        authorName:  user ? (user.displayName || user.email) : 'Anonymous',
        status:      'PENDING',
        upvotes:     0,
        createdAt:   serverTimestamp(),
      });

      setUploadProgress('');
      setSubmitting(false);
      setSubmitted(true);
    } catch (err) {
      console.error('Submit error:', err);
      setUploadProgress('');
      setSubmitting(false);
      alert('Failed to submit: ' + err.message);
    }
  };


  const completionPct = [
    !!title.trim(), !!category, description.trim().length >= 20, files.length > 0
  ].filter(Boolean).length * 25;

  /* ── success screen ── */
  if (submitted) {
    return (
      <div className="si-page">
        <SiOrbs />
        <div className="si-success-wrap">
          <div className="si-success-icon">
            <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </div>
          <h2 className="si-success-title">Initiative Submitted!</h2>
          <p className="si-success-sub">Your report <strong>"{title}"</strong> is under review. We'll notify you within 48 hours.</p>
          <div className="si-success-actions">
            <button className="si-btn-primary" onClick={() => navigate('/user-dashboard')}>View Dashboard</button>
            <button className="si-btn-ghost" onClick={() => { setSubmitted(false); setTitle(''); setCategory(''); setDescription(''); setFiles([]); setTouched({}); }}>Submit Another</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="si-page">
      <SiOrbs />

      {/* ── NAVBAR ── */}
      <nav className="si-navbar">
        <div className="si-nav-inner">
          <div className="si-nav-left">
            <div className="si-brand" onClick={() => navigate('/')}>
              <div className="si-brand-icon">
                <svg viewBox="0 0 24 24" fill="white" stroke="none">
                  <path d="M4 10v7h3v-7H4zm6 0v7h3v-7h-3zM2 22h19v-3H2v3zm14-12v7h3v-7h-3zm-4.5-9L2 6v2h19V6l-9.5-5z"/>
                </svg>
              </div>
              <span className="si-brand-c">Civic</span><span className="si-brand-r">Curator</span>
            </div>
            <div className="si-nav-links">
              {['Dashboard', 'Community', 'Impact'].map(n => (
                <button key={n} className="si-nav-link" onClick={() => n === 'Dashboard' ? navigate('/') : n === 'Community' ? navigate('/community') : null}>{n}</button>
              ))}
            </div>
          </div>
          <div className="si-nav-right">
            <div className="si-search-box">
              <svg className="si-search-ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <input type="text" className="si-search-inp" placeholder="Search initiatives…" />
            </div>
            <button className="si-icon-btn" aria-label="Notifications">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
              </svg>
              <span className="si-notif-dot"/>
            </button>
            <img src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=100&auto=format&fit=crop" alt="Profile" className="si-avatar" onClick={() => navigate('/user-dashboard')} />
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <div className="si-hero">
        <div className="si-hero-pill">
          <span className="si-hero-pill-dot"/>
          Contribution Portal
        </div>
        <h1 className="si-hero-title">
          Submit Your <span>Report or Idea</span>
        </h1>
        <p className="si-hero-sub">
          Transform local insight into community impact. Fill in the details below to start a new initiative or flag an urgent concern.
        </p>

        {/* progress bar */}
        <div className="si-progress-wrap">
          <div className="si-progress-bar">
            <div className="si-progress-fill" style={{ width: `${completionPct}%` }} />
          </div>
          <span className="si-progress-label">{completionPct}% complete</span>
        </div>
      </div>

      {/* ── FORM ── */}
      <main className="si-main">
        <form className="si-form" onSubmit={handleSubmit} noValidate>

          {/* ─── Title ─── */}
          <div className="si-card">
            <div className="si-card-head">
              <span className="si-card-num">01</span>
              <div>
                <p className="si-card-title">Initiative Title</p>
                <p className="si-card-sub">A concise headline that captures the essence of your proposal</p>
              </div>
            </div>
            <div className={`si-input-wrap ${touched.title && errors.title ? 'err' : touched.title && !errors.title ? 'ok' : ''}`}>
              <svg className="si-input-ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
              <input
                id="si-title"
                type="text"
                className="si-input"
                placeholder="e.g. Fix the broken streetlights on Oak Avenue"
                value={title}
                onChange={e => setTitle(e.target.value)}
                onBlur={() => touch('title')}
              />
            </div>
            {touched.title && errors.title && <p className="si-err">{errors.title}</p>}
          </div>

          {/* ─── Category ─── */}
          <div className="si-card">
            <div className="si-card-head">
              <span className="si-card-num">02</span>
              <div>
                <p className="si-card-title">Category</p>
                <p className="si-card-sub">Select the area your initiative best belongs to</p>
              </div>
            </div>
            <div className="si-cat-grid">
              {CATEGORIES.map(c => (
                <button
                  key={c.val}
                  type="button"
                  className={`si-cat-card ${category === c.val ? 'selected' : ''}`}
                  style={category === c.val ? { '--cat-color': c.color, borderColor: c.color, background: `${c.color}14` } : { '--cat-color': c.color }}
                  onClick={() => { setCategory(c.val); touch('category'); }}
                >
                  <span className="si-cat-emoji">{c.emoji}</span>
                  <span className="si-cat-label">{c.label}</span>
                  {category === c.val && (
                    <span className="si-cat-check">
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                    </span>
                  )}
                </button>
              ))}
            </div>
            {touched.category && errors.category && <p className="si-err">{errors.category}</p>}
          </div>

          {/* ─── Urgency ─── */}
          <div className="si-card">
            <div className="si-card-head">
              <span className="si-card-num">03</span>
              <div>
                <p className="si-card-title">Urgency Level</p>
                <p className="si-card-sub">How time-sensitive is this issue?</p>
              </div>
            </div>
            <div className="si-urgency-row">
              {URGENCY.map(u => (
                <button
                  key={u.val}
                  type="button"
                  className={`si-urgency-btn ${urgency === u.val ? 'active' : ''}`}
                  style={urgency === u.val ? { '--u-color': u.color, '--u-bg': u.bg, '--u-border': u.border } : {}}
                  onClick={() => setUrgency(u.val)}
                >
                  <span className="si-urgency-icon">{u.icon}</span>
                  <span className="si-urgency-label">{u.val}</span>
                  <span className="si-urgency-blinker" style={urgency === u.val ? { background: u.color } : {}} />
                </button>
              ))}
            </div>
          </div>

          {/* ─── Description ─── */}
          <div className="si-card">
            <div className="si-card-head">
              <span className="si-card-num">04</span>
              <div>
                <p className="si-card-title">Description</p>
                <p className="si-card-sub">Be specific — include location, impact, and any relevant context</p>
              </div>
            </div>
            <textarea
              className={`si-textarea ${touched.description && errors.description ? 'err' : touched.description && !errors.description ? 'ok' : ''}`}
              placeholder="Describe the issue or initiative in detail. What impact will this have on the community? Who is affected and how often?"
              rows={6}
              maxLength={MAX_CHARS}
              value={description}
              onChange={e => setDescription(e.target.value)}
              onBlur={() => touch('description')}
            />
            <div className="si-char-row">
              {touched.description && errors.description && <p className="si-err" style={{margin:0}}>{errors.description}</p>}
              <span className={`si-char-count ${description.length > MAX_CHARS * 0.9 ? 'warn' : ''}`}>
                {description.length} / {MAX_CHARS}
              </span>
            </div>
          </div>

          {/* ─── Location ─── */}
          <div className="si-card">
            <div className="si-card-head">
              <span className="si-card-num">05</span>
              <div>
                <p className="si-card-title">Location</p>
                <p className="si-card-sub">Click the map to pin the exact location of the issue</p>
              </div>
            </div>
            <div className="si-map-wrap">
              <img
                src="https://images.unsplash.com/photo-1524661135-423995f22d0b?q=80&w=1200&auto=format&fit=crop"
                alt="Map"
                className="si-map-img"
              />
              <div className="si-map-overlay" />
              <div className="si-map-grid"/>
              <button type="button" className="si-pin-btn" onClick={() => alert('Map pinpoint tool initialised.')}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                </svg>
                Pinpoint on Map
              </button>
              <div className="si-map-badge">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                No pin placed yet
              </div>
            </div>
          </div>

          {/* ─── Evidence Upload ─── */}
          <div className="si-card">
            <div className="si-card-head">
              <span className="si-card-num">06</span>
              <div>
                <p className="si-card-title">Visual Evidence <span className="si-optional">Optional</span></p>
                <p className="si-card-sub">Photos and videos dramatically increase review speed (max 6 files · 25 MB each)</p>
              </div>
            </div>

            {/* Drop zone */}
            <div
              className={`si-dropzone ${dragOver ? 'drag-active' : ''} ${files.length > 0 ? 'has-files' : ''}`}
              onClick={() => fileInputRef.current?.click()}
              onDragOver={e => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
            >
              {files.length === 0 ? (
                <div className="si-dz-empty">
                  <div className="si-dz-icon-ring">
                    <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                      <polyline points="17 8 12 3 7 8"/>
                      <line x1="12" y1="3" x2="12" y2="15"/>
                    </svg>
                  </div>
                  <p className="si-dz-main">Drop files here or <span>browse</span></p>
                  <p className="si-dz-formats">JPG · PNG · GIF · MP4 · max 25 MB</p>
                </div>
              ) : (
                <div className="si-dz-preview-area" onClick={e => e.stopPropagation()}>
                  <div className="si-file-grid">
                    {files.map((f, i) => (
                      <FileThumb key={i} file={f} onRemove={() => removeFile(i)} />
                    ))}
                    {files.length < 6 && (
                      <div className="si-add-more" onClick={() => fileInputRef.current?.click()}>
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                        </svg>
                        <span>Add more</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
              <input ref={fileInputRef} type="file" style={{display:'none'}} accept="image/*,video/*" multiple onChange={e => addFiles(e.target.files)} />
            </div>
          </div>

          {/* ─── Actions ─── */}
          <div className="si-actions">
            <button
              type="submit"
              className={`si-btn-primary ${submitting ? 'loading' : ''} ${!isValid ? 'disabled-look' : ''}`}
              disabled={submitting}
            >
              {submitting ? (
                <><span className="si-spinner"/>&nbsp;{uploadProgress || 'Submitting…'}</>
              ) : (
                <>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="22" y1="2" x2="11" y2="13"/>
                    <polygon points="22 2 15 22 11 13 2 9 22 2"/>
                  </svg>
                  Submit Initiative
                </>
              )}
            </button>
            <button type="button" className="si-btn-ghost" onClick={() => alert('Draft saved!')}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
                <polyline points="17 21 17 13 7 13 7 21"/>
                <polyline points="7 3 7 8 15 8"/>
              </svg>
              Save Draft
            </button>
          </div>

          <p className="si-footer-note">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
            </svg>
            Reports are reviewed within 48 hours by the Civic Curator team.
          </p>
        </form>
      </main>
    </div>
  );
}

/* ── File thumbnail ── */
function FileThumb({ file, onRemove }) {
  const [preview, setPreview] = React.useState(null);
  React.useEffect(() => {
    if (file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file);
      setPreview(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [file]);

  return (
    <div className="si-file-thumb">
      {preview
        ? <img src={preview} alt={file.name} className="si-thumb-img"/>
        : (
          <div className="si-thumb-video">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
            </svg>
          </div>
        )
      }
      <button className="si-thumb-remove" onClick={e => { e.stopPropagation(); onRemove(); }} aria-label="Remove file">
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>
      <div className="si-thumb-name">{file.name.length > 12 ? file.name.slice(0,10)+'…' : file.name}</div>
    </div>
  );
}

/* ── Background Orbs ── */
function SiOrbs() {
  return (
    <>
      <div className="si-orb si-orb-a"/>
      <div className="si-orb si-orb-b"/>
      <div className="si-orb si-orb-c"/>
    </>
  );
}
