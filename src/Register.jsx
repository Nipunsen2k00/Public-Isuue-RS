// src/Register.jsx
import React, { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { createUserWithEmailAndPassword, updateProfile, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { auth, db, storage } from './firebase';
import './Register.css';

/* ── helpers ── */
function getPasswordStrength(pw) {
  if (!pw) return { score: 0, label: '', color: '' };
  let score = 0;
  if (pw.length >= 8)  score++;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  if (score <= 1) return { score, label: 'Weak',   color: '#ef4444' };
  if (score <= 2) return { score, label: 'Fair',   color: '#f59e0b' };
  if (score <= 3) return { score, label: 'Good',   color: '#06b6d4' };
  return             { score, label: 'Strong', color: '#22c55e' };
}

const STEPS = ['Account', 'Profile', 'Verify'];

export default function Register() {
  const navigate = useNavigate();

  /* ── form state ── */
  const [step, setStep] = useState(0);
  const [showPw,    setShowPw]    = useState(false);
  const [showConfPw,setShowConfPw]= useState(false);
  const [animDir,   setAnimDir]   = useState('forward');

  const [form, setForm] = useState({
    email: '', password: '', confirmPassword: '',
    fullName: '', username: '', phone: '', role: '',
    agree: false,
  });

  const [profilePic, setProfilePic]       = useState(null);   // File object
  const [picPreview, setPicPreview]       = useState(null);   // data-URL
  const [picDragOver, setPicDragOver]     = useState(false);
  const fileInputRef                       = useRef(null);

  const [touched,     setTouched]     = useState({});
  const [submitting,   setSubmitting]   = useState(false);
  const [firebaseError,setFirebaseError]= useState('');
  const [googleLoading,setGoogleLoading]= useState(false);

  const strength = getPasswordStrength(form.password);

  function update(field, val) {
    setForm(f => ({ ...f, [field]: val }));
  }
  function touch(field) {
    setTouched(t => ({ ...t, [field]: true }));
  }

  /* ── validation ── */
  const errors = {
    email:      !form.email || !/^[^@]+@[^@]+\.[^@]+$/.test(form.email) ? 'Valid email required' : '',
    password:   form.password.length < 8 ? 'Min 8 characters' : '',
    confirmPassword: form.confirmPassword !== form.password ? 'Passwords must match' : '',
    fullName:   form.fullName.trim().length < 2 ? 'Full name required' : '',
    username:   form.username.trim().length < 3 ? 'Min 3 characters' : '',
    role:       !form.role ? 'Please select a role' : '',
    agree:      !form.agree ? 'You must agree to continue' : '',
  };

  function stepValid(s) {
    if (s === 0) return !errors.email && !errors.password && !errors.confirmPassword;
    if (s === 1) return !errors.fullName && !errors.username && !errors.role;
    if (s === 2) return !errors.agree;
    return true;
  }

  function goNext() {
    // touch all fields in current step
    if (step === 0) {
      setTouched(t => ({ ...t, email: true, password: true, confirmPassword: true }));
      if (!stepValid(0)) return;
    }
    if (step === 1) {
      setTouched(t => ({ ...t, fullName: true, username: true, role: true }));
      if (!stepValid(1)) return;
    }
    setAnimDir('forward');
    setStep(s => s + 1);
  }

  function goBack() {
    setAnimDir('back');
    setStep(s => s - 1);
  }

  /* ── profile picture handlers ── */
  const handleProfilePicChange = useCallback((file) => {
    if (!file || !file.type.startsWith('image/')) return;
    setProfilePic(file);
    const reader = new FileReader();
    reader.onload = (ev) => setPicPreview(ev.target.result);
    reader.readAsDataURL(file);
  }, []);

  function handleDrop(e) {
    e.preventDefault();
    setPicDragOver(false);
    const file = e.dataTransfer.files[0];
    handleProfilePicChange(file);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setTouched(t => ({ ...t, agree: true }));
    if (!stepValid(2)) return;
    setFirebaseError('');
    setSubmitting(true);
    try {
      // 1. Create Firebase Auth account
      const { user } = await createUserWithEmailAndPassword(auth, form.email, form.password);

      // 2. Update display name
      await updateProfile(user, { displayName: form.fullName });

      // 2.5. Force token refresh to ensure auth propagates before writes
      await user.getIdToken(true);

      // 3. Upload profile picture to Firebase Storage (if selected)
      // This is done in a separate try/catch so a storage permission issue
      // does NOT block the user from completing registration.
      let profilePicUrl = '';
      let picUploadWarning = '';
      if (profilePic) {
        try {
          const storageRef = ref(storage, `profilePics/${user.uid}/${Date.now()}_${profilePic.name}`);
          const snapshot = await uploadBytes(storageRef, profilePic);
          profilePicUrl = await getDownloadURL(snapshot.ref);
          
          // Update Firebase Auth photoURL with the uploaded image
          await updateProfile(user, { photoURL: profilePicUrl });
        } catch (storageErr) {
          // Profile pic upload failed — log it but don't block registration
          console.warn('Profile pic upload failed (non-fatal):', storageErr.code, storageErr.message);
          
          if (storageErr.code === 'storage/quota-exceeded') {
            picUploadWarning = 'Profile picture upload skipped: Storage quota exceeded. You can add a profile picture later.';
          } else {
            picUploadWarning = `Profile picture upload failed (${storageErr.code}). Registration completed. You can add a picture later.`;
          }
        }
      }

      // 4. Save profile to Firestore
      // Use uploaded profile pic if available, otherwise fall back to photoURL from auth provider (Google, etc.)
      const finalProfilePicUrl = profilePicUrl || user.photoURL || '';
      
      await setDoc(doc(db, 'users', user.uid), {
        uid:         user.uid,
        email:       form.email,
        fullName:    form.fullName,
        username:    form.username,
        phone:       form.phone   || '',
        role:        form.role,
        profilePicUrl: finalProfilePicUrl,
        createdAt:   serverTimestamp(),
      });

      if (form.email.toLowerCase() === 'admin@civiccurator.com') {
        navigate('/admin');
      } else {
        navigate('/user-dashboard');
      }
      
      // Show warning if picture upload failed but registration succeeded
      if (picUploadWarning) {
        console.warn(picUploadWarning);
      }
    } catch (err) {
      console.error('Registration error details:', {
        code: err?.code,
        message: err?.message,
        fullError: err
      });
      setFirebaseError(friendlyRegError(err?.code));
      setSubmitting(false);
    }
  }

  function friendlyRegError(code) {
    switch (code) {
      case 'auth/email-already-in-use': return 'An account with this email already exists. Try signing in instead.';
      case 'auth/invalid-email':        return 'Please enter a valid email address.';
      case 'auth/weak-password':        return 'Password must be at least 6 characters.';
      case 'auth/popup-blocked':        return 'Pop-up blocked. Please allow pop-ups and try again.';
      case 'auth/network-request-failed': return 'Network error. Please check your connection and try again.';
      case 'auth/too-many-requests':    return 'Too many attempts. Please wait a moment and try again.';
      case 'auth/operation-not-supported-in-this-environment': return 'Google Sign-In is not available in this environment.';
      default: return code ? `Error: ${code}` : 'Something went wrong. Please try again.';
    }
  }

  async function handleGoogleSignup() {
    setFirebaseError('');
    setGoogleLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      const result = await signInWithPopup(auth, provider);
      
      if (result.user.email?.toLowerCase() === 'admin@civiccurator.com') {
        navigate('/admin');
      } else {
        navigate('/submit');
      }
    } catch (err) {
      console.error('Google Sign-Up Error:', err.code, err.message);
      setFirebaseError(friendlyRegError(err.code));
    } finally {
      setGoogleLoading(false);
    }
  }

  /* ── field error display helper ── */
  function FieldError({ field }) {
    return touched[field] && errors[field]
      ? <span className="field-error">{errors[field]}</span>
      : null;
  }

  /* ── stats for decorative panel ── */
  const stats = [
    { value: '42K+', label: 'Active Citizens' },
    { value: '8.1K', label: 'Issues Resolved' },
    { value: '$2.4M', label: 'Funds Directed' },
  ];

  return (
    <div className="register-page">
      {/* animated background orbs */}
      <div className="orb orb-a" />
      <div className="orb orb-b" />
      <div className="orb orb-c" />

      <div className="register-card">

        {/* ── FORM PANEL ── */}
        <div className="register-left">

          {/* top logo */}
          <div className="reg-top-logo" onClick={() => navigate('/')}>
            <div className="reg-icon-wrap">
              <svg viewBox="0 0 24 24" fill="white" stroke="none">
                <path d="M4 10v7h3v-7H4zm6 0v7h3v-7h-3zM2 22h19v-3H2v3zm14-12v7h3v-7h-3zm-4.5-9L2 6v2h19V6l-9.5-5z"/>
              </svg>
            </div>
            <span className="reg-logo-civic">Civic</span>
            <span className="reg-logo-rest">Curator</span>
          </div>

          {/* step progress */}
          <div className="step-progress">
            {STEPS.map((label, i) => (
              <React.Fragment key={label}>
                <div className={`step-dot ${i < step ? 'done' : i === step ? 'active' : ''}`}>
                  {i < step
                    ? <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                    : <span>{i + 1}</span>
                  }
                  <div className="step-label">{label}</div>
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`step-line ${i < step ? 'filled' : ''}`} />
                )}
              </React.Fragment>
            ))}
          </div>

          {/* ── STEP 0 : Credentials ── */}
          {step === 0 && (
            <div className={`step-panel ${animDir === 'forward' ? 'slide-in' : 'slide-in-back'}`}>
              <h2 className="step-title">Create Your Account</h2>
              <p className="step-sub">Start with your email and a strong password.</p>

              {/* Email */}
              <div className="form-group">
                <label className="form-label">Email Address</label>
                <div className={`input-wrapper ${touched.email && errors.email ? 'has-error' : touched.email && !errors.email ? 'has-success' : ''}`}>
                  <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                    <polyline points="22,6 12,13 2,6"/>
                  </svg>
                  <input
                    id="reg-email"
                    type="email"
                    className="register-input"
                    placeholder="jane@community.org"
                    value={form.email}
                    onChange={e => update('email', e.target.value)}
                    onBlur={() => touch('email')}
                    autoComplete="email"
                  />
                  {touched.email && !errors.email && <StatusIcon ok />}
                </div>
                <FieldError field="email" />
              </div>

              {/* Password */}
              <div className="form-group">
                <label className="form-label">Password</label>
                <div className={`input-wrapper ${touched.password && errors.password ? 'has-error' : touched.password && !errors.password ? 'has-success' : ''}`}>
                  <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                  <input
                    id="reg-password"
                    type={showPw ? 'text' : 'password'}
                    className="register-input has-right-icon"
                    placeholder="Create a strong password"
                    value={form.password}
                    onChange={e => update('password', e.target.value)}
                    onBlur={() => touch('password')}
                    autoComplete="new-password"
                  />
                  <button type="button" className="icon-btn right" onClick={() => setShowPw(v => !v)} tabIndex={-1}>
                    {showPw
                      ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                      : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                    }
                  </button>
                </div>
                <FieldError field="password" />
                {/* strength bar */}
                {form.password && (
                  <div className="strength-wrap">
                    <div className="strength-bars">
                      {[1,2,3,4,5].map(n => (
                        <div key={n} className="strength-bar" style={{ background: n <= strength.score ? strength.color : 'rgba(255,255,255,0.08)' }} />
                      ))}
                    </div>
                    <span className="strength-label" style={{ color: strength.color }}>{strength.label}</span>
                  </div>
                )}
              </div>

              {/* Confirm Password */}
              <div className="form-group">
                <label className="form-label">Confirm Password</label>
                <div className={`input-wrapper ${touched.confirmPassword && errors.confirmPassword ? 'has-error' : touched.confirmPassword && !errors.confirmPassword ? 'has-success' : ''}`}>
                  <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                  </svg>
                  <input
                    id="reg-confirm"
                    type={showConfPw ? 'text' : 'password'}
                    className="register-input has-right-icon"
                    placeholder="Repeat your password"
                    value={form.confirmPassword}
                    onChange={e => update('confirmPassword', e.target.value)}
                    onBlur={() => touch('confirmPassword')}
                    autoComplete="new-password"
                  />
                  <button type="button" className="icon-btn right" onClick={() => setShowConfPw(v => !v)} tabIndex={-1}>
                    {showConfPw
                      ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                      : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                    }
                  </button>
                </div>
                <FieldError field="confirmPassword" />
              </div>

              <button type="button" className="btn-register" onClick={goNext}>
                Continue
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
                </svg>
              </button>

              <div className="divider"><span>Or sign up with</span></div>
              <div className="social-register">
                <button type="button" className="btn-social" onClick={handleGoogleSignup} disabled={googleLoading}>
                  {googleLoading ? (
                    <>
                      <span className="login-spinner"/>
                      Signing up…
                    </>
                  ) : (
                    <>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.531,6.489,2.531,12s4.49,10,10.014,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z"/>
                      </svg>
                      Google
                    </>
                  )}
                </button>
                <button type="button" className="btn-social" onClick={() => navigate('/login')}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 10v7h3v-7H4zm6 0v7h3v-7h-3zM2 22h19v-3H2v3zm14-12v7h3v-7h-3zm-4.5-9L2 6v2h19V6l-9.5-5z"/>
                  </svg>
                  Civic ID
                </button>
              </div>

              <p className="signin-text">
                Already have an account?&nbsp;
                <span onClick={() => navigate('/login')}>Sign In</span>
              </p>
            </div>
          )}

          {/* ── STEP 1 : Profile ── */}
          {step === 1 && (
            <div className={`step-panel ${animDir === 'forward' ? 'slide-in' : 'slide-in-back'}`}>
              <h2 className="step-title">Your Profile</h2>
              <p className="step-sub">Tell us a bit about yourself.</p>

              {/* ── Profile Picture Upload ── */}
              <div className="avatar-upload-section">
                <div
                  className={`avatar-drop-zone ${picDragOver ? 'drag-over' : ''} ${picPreview ? 'has-image' : ''}`}
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={(e) => { e.preventDefault(); setPicDragOver(true); }}
                  onDragLeave={() => setPicDragOver(false)}
                  onDrop={handleDrop}
                >
                  {picPreview ? (
                    <>
                      <img src={picPreview} alt="Profile preview" className="avatar-preview-img" />
                      <div className="avatar-overlay">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                          <circle cx="12" cy="13" r="4"/>
                        </svg>
                        <span>Change Photo</span>
                      </div>
                    </>
                  ) : (
                    <div className="avatar-placeholder">
                      <div className="avatar-icon-ring">
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                          <circle cx="12" cy="13" r="4"/>
                        </svg>
                      </div>
                      <p className="avatar-hint-main">Upload Profile Photo</p>
                      <p className="avatar-hint-sub">Drag &amp; drop or <span>click to browse</span></p>
                      <p className="avatar-hint-formats">JPG, PNG, GIF · Max 5 MB</p>
                    </div>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={(e) => handleProfilePicChange(e.target.files[0])}
                />
                {picPreview && (
                  <button
                    type="button"
                    className="avatar-remove-btn"
                    onClick={(e) => { e.stopPropagation(); setProfilePic(null); setPicPreview(null); }}
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                    Remove
                  </button>
                )}
              </div>

              <div className="name-row">
                {/* Full Name */}
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Full Name</label>
                  <div className={`input-wrapper ${touched.fullName && errors.fullName ? 'has-error' : touched.fullName && !errors.fullName ? 'has-success' : ''}`}>
                    <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                    </svg>
                    <input
                      id="reg-fullname"
                      type="text"
                      className="register-input"
                      placeholder="Jane Cooper"
                      value={form.fullName}
                      onChange={e => update('fullName', e.target.value)}
                      onBlur={() => touch('fullName')}
                    />
                    {touched.fullName && !errors.fullName && <StatusIcon ok />}
                  </div>
                  <FieldError field="fullName" />
                </div>

                {/* Username */}
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Username</label>
                  <div className={`input-wrapper ${touched.username && errors.username ? 'has-error' : touched.username && !errors.username ? 'has-success' : ''}`}>
                    <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                    </svg>
                    <input
                      id="reg-username"
                      type="text"
                      className="register-input"
                      placeholder="@jcooper"
                      value={form.username}
                      onChange={e => update('username', e.target.value)}
                      onBlur={() => touch('username')}
                    />
                    {touched.username && !errors.username && <StatusIcon ok />}
                  </div>
                  <FieldError field="username" />
                </div>
              </div>

              {/* Phone (optional) */}
              <div className="form-group">
                <label className="form-label">Phone <span className="optional-tag">Optional</span></label>
                <div className="input-wrapper">
                  <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.57 3.29a2 2 0 0 1 1.99-2.18h3a2 2 0 0 1 2 1.72 12.05 12.05 0 0 0 .66 2.67 2 2 0 0 1-.45 2.11L7.91 8.91a16 16 0 0 0 6.08 6.08l1.11-1.78a2 2 0 0 1 2.11-.45 12.05 12.05 0 0 0 2.67.66A2 2 0 0 1 22 16.92z"/>
                  </svg>
                  <input
                    id="reg-phone"
                    type="tel"
                    className="register-input"
                    placeholder="+1 (555) 000-0000"
                    value={form.phone}
                    onChange={e => update('phone', e.target.value)}
                  />
                </div>
              </div>

              {/* Role / community type */}
              <div className="form-group">
                <label className="form-label">I am a…</label>
                <div className="role-grid">
                  {[
                    { val: 'citizen',     emoji: '🏘️', label: 'Citizen' },
                    { val: 'activist',    emoji: '📢', label: 'Activist' },
                    { val: 'official',    emoji: '🏛️', label: 'Official' },
                    { val: 'journalist',  emoji: '📰', label: 'Journalist' },
                  ].map(r => (
                    <button
                      key={r.val}
                      type="button"
                      className={`role-card ${form.role === r.val ? 'selected' : ''}`}
                      onClick={() => { update('role', r.val); touch('role'); }}
                    >
                      <span className="role-emoji">{r.emoji}</span>
                      <span className="role-label">{r.label}</span>
                    </button>
                  ))}
                </div>
                <FieldError field="role" />
              </div>

              <div className="btn-row">
                <button type="button" className="btn-back" onClick={goBack}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
                  </svg>
                  Back
                </button>
                <button type="button" className="btn-register flex-1" onClick={goNext}>
                  Continue
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
                  </svg>
                </button>
              </div>
            </div>
          )}

          {/* ── STEP 2 : Agree & Submit ── */}
          {step === 2 && (
            <form onSubmit={handleSubmit}>
              <div className={`step-panel ${animDir === 'forward' ? 'slide-in' : 'slide-in-back'}`}>
                <h2 className="step-title">Almost Done!</h2>
                <p className="step-sub">Review and confirm to activate your account.</p>

                {/* Firebase error */}
                {firebaseError && (
                  <div className="field-error" style={{marginBottom:12,padding:'10px 14px',background:'rgba(239,68,68,0.08)',border:'1px solid rgba(239,68,68,0.25)',borderRadius:10,display:'flex',gap:8,alignItems:'center'}}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                    <span style={{color:'#ef4444',fontSize:13}}>{firebaseError}</span>
                  </div>
                )}

                {/* Summary card */}
                <div className="summary-card">
                  <div className="summary-avatar">
                    {picPreview
                      ? <img src={picPreview} alt="Profile" style={{ width:'100%', height:'100%', objectFit:'cover', borderRadius:'50%' }} />
                      : (form.fullName ? form.fullName.charAt(0).toUpperCase() : '?')
                    }
                  </div>
                  <div className="summary-info">
                    <div className="summary-name">{form.fullName || 'Your Name'}</div>
                    <div className="summary-email">{form.email}</div>
                    <div className="summary-role">{form.role || 'No role selected'}</div>
                  </div>
                </div>

                {/* Terms checkbox */}
                <label className={`terms-checkbox ${touched.agree && errors.agree ? 'has-error' : ''}`}>
                  <input
                    type="checkbox"
                    checked={form.agree}
                    onChange={e => { update('agree', e.target.checked); touch('agree'); }}
                  />
                  <span className="custom-check">
                    {form.agree && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>}
                  </span>
                  <span className="terms-text">
                    I agree to the <a href="#" onClick={e => e.preventDefault()}>Terms of Service</a> and <a href="#" onClick={e => e.preventDefault()}>Privacy Policy</a>
                  </span>
                </label>
                <FieldError field="agree" />

                {/* Marketing opt-in */}
                <label className="terms-checkbox" style={{ marginTop: 12 }}>
                  <input type="checkbox" defaultChecked />
                  <span className="custom-check" style={{ '--check-color': '#6366f1' }}>
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                  </span>
                  <span className="terms-text">
                    Send me community updates &amp; news
                  </span>
                </label>

                <div className="btn-row" style={{ marginTop: 28 }}>
                  <button type="button" className="btn-back" onClick={goBack} disabled={submitting}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
                    </svg>
                    Back
                  </button>
                  <button type="submit" className={`btn-register flex-1 ${submitting ? 'loading' : ''}`} disabled={submitting}>
                    {submitting
                      ? <><span className="spinner" /> Creating Account…</>
                      : <>
                          Join CivicCurator
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12"/>
                          </svg>
                        </>
                    }
                  </button>
                </div>

                <p className="signin-text" style={{ marginTop: 20 }}>
                  Already have an account?&nbsp;
                  <span onClick={() => navigate('/login')}>Sign In</span>
                </p>
              </div>
            </form>
          )}

        </div>

        {/* ── DECORATIVE PANEL ── */}
        <div className="register-right-panel">
          <div className="rp-grid-overlay" />

          <div className="register-brand">
            <div className="reg-icon-wrap">
              <svg viewBox="0 0 24 24" fill="white" stroke="none">
                <path d="M4 10v7h3v-7H4zm6 0v7h3v-7h-3zM2 22h19v-3H2v3zm14-12v7h3v-7h-3zm-4.5-9L2 6v2h19V6l-9.5-5z"/>
              </svg>
            </div>
            <span className="register-brand-cyan">Civic</span>
            <span className="register-brand-rest">Curator</span>
          </div>

          <h1 className="register-heading">
            Shape the future<br/>of{' '}
            <span>your community.</span>
          </h1>
          <p className="register-subheading">
            Join thousands of citizens using collaborative action and transparent reporting to impact their neighbourhoods.
          </p>

          {/* stats row */}
          <div className="rp-stats">
            {stats.map(s => (
              <div key={s.value} className="rp-stat">
                <div className="rp-stat-value">{s.value}</div>
                <div className="rp-stat-label">{s.label}</div>
              </div>
            ))}
          </div>

          {/* steps */}
          <div className="register-steps">
            {[
              { num: '01', title: 'Create your free account',      body: 'Takes less than 2 minutes. No credit card required.' },
              { num: '02', title: 'Report issues or share ideas',   body: 'Add location, photos, and context to your submission.' },
              { num: '03', title: 'Track real-time progress',       body: 'Get notified as community members vote and authorities act.' },
            ].map(s => (
              <div key={s.num} className="reg-step">
                <div className="reg-step-num">{s.num}</div>
                <div className="reg-step-text">
                  <strong>{s.title}</strong>
                  <span>{s.body}</span>
                </div>
              </div>
            ))}
          </div>

          {/* testimonial */}
          <div className="rp-testimonial">
            <div className="rp-quote-icon">"</div>
            <p className="rp-quote-text">CivicCurator helped our neighbourhood finally get a new playground after 3 years of waiting. The transparency is incredible.</p>
            <div className="rp-quote-author">
              <div className="rp-author-avatar">M</div>
              <div>
                <div className="rp-author-name">Maria S.</div>
                <div className="rp-author-role">Community Leader, Boston</div>
              </div>
            </div>
          </div>

          {/* floating image */}
          <div className="register-image">
            <img src="https://images.unsplash.com/photo-1511884642898-4c92249e20b6?q=80&w=800&auto=format&fit=crop" alt="Community" />
          </div>
        </div>

      </div>
    </div>
  );
}

/* ── tiny inline components ── */
function StatusIcon({ ok }) {
  return (
    <div className={`status-icon ${ok ? 'ok' : 'err'}`}>
      {ok
        ? <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
        : <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      }
    </div>
  );
}
