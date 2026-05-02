import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './Legal.css';

const Legal = () => {
    const navigate = useNavigate();
    const { pathname } = useLocation();

    useEffect(() => {
        window.scrollTo(0, 0);
    }, [pathname]);

    return (
        <div className="legal-page">
            <nav className="legal-nav">
                <div className="legal-container">
                    <div className="legal-brand" onClick={() => navigate('/')}>
                        <span className="civic">Civic</span><span className="curator"> Curator</span>
                    </div>
                    <button className="legal-back-btn" onClick={() => navigate(-1)}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M19 12H5M12 19l-7-7 7-7"/>
                        </svg>
                        Back
                    </button>
                </div>
            </nav>

            <main className="legal-content legal-container">
                <section id="privacy">
                    <h1>Privacy Policy</h1>
                    <p className="legal-date">Last Updated: May 2024</p>
                    <p>At Civic Curator, we take your privacy seriously. This policy describes how we collect, use, and handle your personal information when you use our platform.</p>
                    
                    <h2>1. Information We Collect</h2>
                    <p>We collect information you provide directly to us, such as when you create an account, submit an issue, or communicate with us. This may include your name, email address, location data associated with reports, and any photos or descriptions you upload.</p>
                    
                    <h2>2. How We Use Your Information</h2>
                    <p>We use the information we collect to provide, maintain, and improve our services, including processing your reports and facilitating community engagement. Location data is used specifically to map community issues for public awareness and official action.</p>
                    
                    <h2>3. Data Sharing</h2>
                    <p>Your reports (excluding sensitive personal details) are shared publicly on the platform to encourage transparency. We may share specific data with local authorities or government bodies to facilitate the resolution of reported issues.</p>
                </section>

                <hr className="legal-divider" />

                <section id="terms">
                    <h1>Terms of Service</h1>
                    <p className="legal-date">Last Updated: May 2024</p>
                    
                    <h2>1. Acceptance of Terms</h2>
                    <p>By accessing or using Civic Curator, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our services.</p>
                    
                    <h2>2. User Conduct</h2>
                    <p>You agree to use the platform only for lawful purposes. You are responsible for all content you upload. We prohibit the submission of false reports, harassment, or any content that violates the rights of others.</p>
                    
                    <h2>3. Intellectual Property</h2>
                    <p>The platform and its original content are owned by Civic Curator. By submitting reports or ideas, you grant us a non-exclusive, worldwide, royalty-free license to use, reproduce, and display that content in connection with the platform's services.</p>
                </section>
            </main>

            <footer className="legal-footer">
                <div className="legal-container">
                    <p>© 2024 Civic Curator. Empowering communities through transparency.</p>
                </div>
            </footer>
        </div>
    );
};

export default Legal;
