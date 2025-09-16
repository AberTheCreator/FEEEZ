import React from 'react';

const LandingFooter = () => {
  return (
    <footer className="landing-footer">
      <div className="footer-container">
        <div className="footer-content">
          <div className="footer-brand">
            <div className="brand-logo">
              <span className="brand-icon">💸</span>
              <span className="brand-text">FEEEZ</span>
            </div>
            <p>Decentralized bill payments with AI insights</p>
          </div>
          
          <div className="footer-links">
            <div className="link-group">
              <h4>Product</h4>
              <a href="#features">Features</a>
              <a href="#how-it-works">How it Works</a>
              <a href="#benefits">Benefits</a>
            </div>
            <div className="link-group">
              <h4>Resources</h4>
              <a href="https://docs.feeez.app" target="_blank" rel="noopener noreferrer">Documentation</a>
              <a href="#" target="_blank" rel="noopener noreferrer">Support</a>
              <a href="#" target="_blank" rel="noopener noreferrer">Blog</a>
            </div>
            <div className="link-group">
              <h4>Company</h4>
              <a href="#">About</a>
              <a href="#">Privacy Policy</a>
              <a href="#">Terms of Service</a>
            </div>
          </div>
        </div>
        
        <div className="footer-bottom">
          <div className="footer-legal">
            <p>&copy; 2025 FEEEZ. All rights reserved.</p>
          </div>
          <div className="footer-network">
            <span>Powered by</span>
            <div className="network-badge">
              <span className="network-dot"></span>
              <span>Somnia Network</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default LandingFooter;
