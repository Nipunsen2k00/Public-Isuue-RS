import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from './firebase';
import './Contact.css';

const Contact = () => {
  const navigate = useNavigate();
  const [contactInfo, setContactInfo] = useState({
    email: 'support@civiccurator.com',
    phone: '+1 (555) 000-0000',
    address: '123 Civic Plaza, Metropolis City',
    hours: 'Mon - Fri, 9:00 AM - 6:00 PM'
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchContactInfo = async () => {
      try {
        const docRef = doc(db, 'settings', 'contact');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setContactInfo(docSnap.data());
        }
      } catch (error) {
        console.error('Error fetching contact info:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchContactInfo();
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    alert('Thank you for your message! We will get back to you soon.');
  };

  return (
    <div className="contact-page">
      <div className="contact-glow contact-glow-1"></div>
      <div className="contact-glow contact-glow-2"></div>

      {/* NAVBAR */}
      <nav className="contact-navbar">
        <div className="contact-nav-content">
          <div className="contact-brand" onClick={() => navigate('/')}>
            <span className="civic">Civic</span><span className="curator"> Curator</span>
          </div>
          <div className="contact-nav-links">
            <span className="contact-nav-link" onClick={() => navigate('/')}>Dashboard</span>
            <span className="contact-nav-link" onClick={() => navigate('/community')}>Community</span>
            <span className="contact-nav-link active">Contact</span>
          </div>
        </div>
      </nav>

      <main className="contact-main">
        <header className="contact-header">
          <div className="contact-eyebrow">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
            </svg>
            Contact Support
          </div>
          <h1 className="contact-title">Get in Touch</h1>
          <p className="contact-subtitle">
            Have questions about a report or an idea? Our team is here to help you navigate the platform and maximize your impact.
          </p>
        </header>

        <div className="contact-grid">
          <div className="contact-info-cards">
            <div className="contact-card">
              <div className="contact-card-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
                </svg>
              </div>
              <h3 className="contact-card-title">Email Us</h3>
              <p className="contact-card-value">{contactInfo.email}</p>
            </div>

            <div className="contact-card">
              <div className="contact-card-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
                </svg>
              </div>
              <h3 className="contact-card-title">Our Office</h3>
              <p className="contact-card-value">{contactInfo.address}</p>
            </div>

            <div className="contact-card">
              <div className="contact-card-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                </svg>
              </div>
              <h3 className="contact-card-title">Working Hours</h3>
              <p className="contact-card-value">{contactInfo.hours}</p>
            </div>
          </div>

          <div className="contact-form-card">
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input type="text" className="form-input" placeholder="John Doe" required />
              </div>
              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input type="email" className="form-input" placeholder="john@example.com" required />
              </div>
              <div className="form-group">
                <label className="form-label">Subject</label>
                <input type="text" className="form-input" placeholder="How can we help?" required />
              </div>
              <div className="form-group">
                <label className="form-label">Message</label>
                <textarea className="form-textarea" placeholder="Tell us more about your inquiry..." required></textarea>
              </div>
              <button type="submit" className="contact-btn">
                Send Message
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
                </svg>
              </button>
            </form>
          </div>
        </div>
      </main>

      <footer style={{textAlign: 'center', padding: '4rem 0', opacity: 0.4, fontSize: '0.875rem'}}>
        &copy; {new Date().getFullYear()} Civic Curator. All rights reserved.
      </footer>
    </div>
  );
};

export default Contact;
