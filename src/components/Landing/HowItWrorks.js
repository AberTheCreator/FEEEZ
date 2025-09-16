import React, { useState, useEffect } from 'react';

const HowItWorks = () => {
  const [activeStep, setActiveStep] = useState(0);
  const [autoPlay, setAutoPlay] = useState(true);

  const steps = [
    {
      id: 1,
      icon: '🔗',
      title: 'Connect Wallet',
      description: 'Link your MetaMask or compatible Web3 wallet to get started.',
      details: [
        'Support for MetaMask, WalletConnect, and more',
        'Automatic network switching to Somnia',
        'Secure connection with no personal data stored'
      ],
      visual: 'wallet-connection'
    },
    {
      id: 2,
      icon: '📋',
      title: 'Create or Join Bills',
      description: 'Set up recurring bills or join shared expense pools with others.',
      details: [
        'Schedule one-time or recurring payments',
        'Join collaborative bill splitting pools',
        'Categorize bills for better organization'
      ],
      visual: 'bill-creation'
    },
    {
      id: 3,
      icon: '💳',
      title: 'Make Secure Payments',
      description: 'Execute payments with built-in escrow protection and confirmations.',
      details: [
        'Payments held in secure escrow',
        '7-day confirmation period',
        'Automatic refunds for disputed payments'
      ],
      visual: 'payment-flow'
    },
    {
      id: 4,
      icon: '🏆',
      title: 'Earn NFT Rewards',
      description: 'Get rewarded with exclusive NFTs for consistent payment behavior.',
      details: [
        'Bronze to Diamond tier progression',
        'Special achievement badges',
        'Streak rewards for consistent payments'
      ],
      visual: 'nft-rewards'
    }
  ];

  useEffect(() => {
    if (!autoPlay) return;

    const timer = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % steps.length);
    }, 4000);

    return () => clearInterval(timer);
  }, [autoPlay, steps.length]);

  const handleStepClick = (index) => {
    setActiveStep(index);
    setAutoPlay(false);
    setTimeout(() => setAutoPlay(true), 10000); 
  };

  return (
    <section className="how-it-works-section" id="how-it-works">
      <div className="how-it-works-container">
        <div className="section-header">
          <div className="section-badge">
            <span className="badge-icon">🔄</span>
            <span className="badge-text">How It Works</span>
          </div>
          <h2 className="section-title">
            Get Started in
            <span className="title-highlight"> 4 Simple Steps</span>
          </h2>
          <p className="section-description">
            From wallet connection to earning rewards, FEEEZ makes bill payments 
            effortless and rewarding.
          </p>
        </div>

        <div className="steps-container">
          <div className="steps-navigation">
            {steps.map((step, index) => (
              <button
                key={step.id}
                className={`step-nav ${activeStep === index ? 'active' : ''}`}
                onClick={() => handleStepClick(index)}
              >
                <div className="step-number">{step.id}</div>
                <div className="step-icon">{step.icon}</div>
                <div className="step-title">{step.title}</div>
                <div className="step-progress">
                  <div className="progress-bar">
                    <div 
                      className={`progress-fill ${activeStep === index ? 'active' : ''}`}
                      style={{
                        animationDuration: autoPlay && activeStep === index ? '4s' : '0s'
                      }}
                    ></div>
                  </div>
                </div>
              </button>
            ))}
          </div>

          <div className="steps-content">
            <div className="step-visual">
              <div className={`visual-container ${steps[activeStep].visual}`}>
                {steps[activeStep].visual === 'wallet-connection' && (
                  <div className="wallet-mockup">
                    <div className="wallet-popup">
                      <div className="popup-header">
                        <span className="wallet-icon">🦊</span>
                        <span className="wallet-name">MetaMask</span>
                      </div>
                      <div className="popup-content">
                        <div className="connection-request">
                          <p>Connect to FEEEZ?</p>
                          <button className="connect-btn">Connect</button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {steps[activeStep].visual === 'bill-creation' && (
                  <div className="bill-form-mockup">
                    <div className="form-header">Create Bill</div>
                    <div className="form-fields">
                      <div className="form-field">
                        <label>Bill Name</label>
                        <div className="input-mockup">Electric Bill</div>
                      </div>
                      <div className="form-field">
                        <label>Amount</label>
                        <div className="input-mockup">$120.50</div>
                      </div>
                      <div className="form-field">
                        <label>Frequency</label>
                        <div className="input-mockup">Monthly</div>
                      </div>
                    </div>
                  </div>
                )}

                {steps[activeStep].visual === 'payment-flow' && (
                  <div className="payment-flow-mockup">
                    <div className="payment-step">
                      <div className="step-icon">💳</div>
                      <div className="step-text">Payment Initiated</div>
                    </div>
                    <div className="flow-arrow">→</div>
                    <div className="payment-step">
                      <div className="step-icon">🔒</div>
                      <div className="step-text">Funds Escrowed</div>
                    </div>
                    <div className="flow-arrow">→</div>
                    <div className="payment-step">
                      <div className="step-icon">✅</div>
                      <div className="step-text">Payment Confirmed</div>
                    </div>
                  </div>
                )}

                {steps[activeStep].visual === 'nft-rewards' && (
                  <div className="nft-showcase-mockup">
                    <div className="nft-card bronze">
                      <div className="nft-tier">🥉</div>
                      <div className="nft-name">Bronze Payer</div>
                    </div>
                    <div className="nft-card silver">
                      <div className="nft-tier">🥈</div>
                      <div className="nft-name">Silver Streak</div>
                    </div>
                    <div className="nft-card gold active">
                      <div className="nft-tier">🥇</div>
                      <div className="nft-name">Gold Master</div>
                      <div className="nft-badge">NEW!</div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="step-details">
              <div className="step-content">
                <h3 className="step-main-title">{steps[activeStep].title}</h3>
                <p className="step-description">{steps[activeStep].description}</p>
                
                <ul className="step-features">
                  {steps[activeStep].details.map((detail, index) => (
                    <li key={index} className="feature-item">
                      <span className="feature-check">✓</span>
                      <span className="feature-text">{detail}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>

        <div className="cta-section">
          <div className="cta-content">
            <h3 className="cta-title">Ready to revolutionize your bill payments?</h3>
            <p className="cta-description">Join thousands of users already saving time and money with FEEEZ.</p>
            <button className="cta-button">
              <span className="btn-text">Start Your Journey</span>
              <span className="btn-icon">🚀</span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
