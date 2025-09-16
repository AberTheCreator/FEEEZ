import React from 'react';

const CTA = ({ onGetStarted }) => {
  return (
    <section className="cta-section" id="cta">
      <div className="cta-container">
        <div className="cta-content">
          <h2>Ready to Transform Your Bill Payments?</h2>
          <p>Join thousands of users saving time and money with FEEEZ's intelligent bill management system.</p>
          
          <div className="cta-actions">
            <button className="cta-primary" onClick={onGetStarted}>
              <span className="btn-text">Start Using FEEEZ</span>
              <span className="btn-icon">🚀</span>
            </button>
            <button className="cta-secondary" onClick={() => window.open('https://docs.feeez.app', '_blank')}>
              <span className="btn-text">Read Documentation</span>
              <span className="btn-icon">📚</span>
            </button>
          </div>
          
          <div className="cta-features">
            <div className="feature-highlight">
              <span className="feature-icon">✅</span>
              <span>No monthly fees</span>
            </div>
            <div className="feature-highlight">
              <span className="feature-icon">✅</span>
              <span>Connect any wallet</span>
            </div>
            <div className="feature-highlight">
              <span className="feature-icon">✅</span>
              <span>Start in 30 seconds</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTA;
