import React, { useState, useEffect } from 'react';

const Hero = ({ onGetStarted }) => {
  const [typedText, setTypedText] = useState('');
  const fullText = 'Bills Paid. Fees Gone.';
  
  useEffect(() => {
    let index = 0;
    const timer = setInterval(() => {
      if (index <= fullText.length) {
        setTypedText(fullText.slice(0, index));
        index++;
      } else {
        clearInterval(timer);
      }
    }, 100);

    return () => clearInterval(timer);
  }, []);

  const handleDemo = () => {
    
    const featuresSection = document.getElementById('features');
    if (featuresSection) {
      featuresSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className="hero-section" id="hero">
      <div className="hero-background">
        <div className="hero-gradient"></div>
        <div className="hero-shapes">
          <div className="shape shape-1"></div>
          <div className="shape shape-2"></div>
          <div className="shape shape-3"></div>
        </div>
      </div>

      <div className="hero-container">
  <div className="hero-content">
    <div className="hero-text">
      <h1 className="hero-title">
        <span className="title-brand">
          <img src="/logo192.png" alt="FEEEZ Logo" className="hero-logo" />
          FEEEZ 
        </span>
        <span className="title-tagline">{typedText}</span>
        <span className="cursor">|</span>
      </h1>
            
            <p className="hero-subtitle">
              Decentralized bill payments with AI insights, NFT rewards, and shared expenses. 
              Experience the future of financial management on Somnia Network.
            </p>

            <div className="hero-stats">
              <div className="stat">
                <span className="stat-number">⚡</span>
                <span className="stat-label">Lightning Fast</span>
              </div>
              <div className="stat">
                <span className="stat-number">🔒</span>
                <span className="stat-label">Secure</span>
              </div>
              <div className="stat">
                <span className="stat-number">💰</span>
                <span className="stat-label">Low Fees</span>
              </div>
            </div>

            <div className="hero-actions">
              <button 
                className="cta-primary"
                onClick={onGetStarted}
              >
                <span className="btn-text">Get Started</span>
                <span className="btn-icon">🚀</span>
              </button>
              
              <button 
                className="cta-secondary"
                onClick={handleDemo}
              >
                <span className="btn-text">Explore Demo</span>
                <span className="btn-icon">👁️</span>
              </button>
            </div>

            <div className="hero-trust">
              <p className="trust-text">Powered by</p>
              <div className="trust-badges">
                <div className="trust-badge">
                  <span className="badge-icon">⛓️</span>
                  <span className="badge-text">Somnia Network</span>
                </div>
                <div className="trust-badge">
                  <span className="badge-icon">🤖</span>
                  <span className="badge-text">Google AI</span>
                </div>
              </div>
            </div>
          </div>

          <div className="hero-visual">
            <div className="hero-app-preview">
              <div className="app-mockup">
                <div className="mockup-header">
                  <div className="mockup-controls">
                    <span className="control control-red"></span>
                    <span className="control control-yellow"></span>
                    <span className="control control-green"></span>
                  </div>
                  <div className="mockup-url">feeez.app</div>
                </div>
                <div className="mockup-content">
                  <div className="mockup-dashboard">
                    <div className="dashboard-stat">
                      <span className="stat-icon">💳</span>
                      <div className="stat-info">
                        <div className="stat-value">$1,250</div>
                        <div className="stat-label">Monthly Bills</div>
                      </div>
                    </div>
                    <div className="dashboard-bills">
                      <div className="bill-item">
                        <span className="bill-icon">⚡</span>
                        <div className="bill-info">
                          <div className="bill-name">Electric Bill</div>
                          <div className="bill-amount">$120.50</div>
                        </div>
                        <div className="bill-status paid">Paid</div>
                      </div>
                      <div className="bill-item">
                        <span className="bill-icon">🌐</span>
                        <div className="bill-info">
                          <div className="bill-name">Internet</div>
                          <div className="bill-amount">$79.99</div>
                        </div>
                        <div className="bill-status due">Due</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="floating-elements">
                <div className="floating-nft">
                  <span className="nft-icon">🏆</span>
                  <span className="nft-text">Gold NFT Earned!</span>
                </div>
                <div className="floating-ai">
                  <span className="ai-icon">🤖</span>
                  <span className="ai-text">Save 15% this month</span>
                </div>
                <div className="floating-pool">
                  <span className="pool-icon">🤝</span>
                  <span className="pool-text">Pool 95% funded</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;