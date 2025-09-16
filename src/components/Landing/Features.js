import React, { useState, useEffect, useRef } from 'react';

const Features = () => {
  const [visibleFeatures, setVisibleFeatures] = useState([]);
  const featuresRef = useRef(null);

  const features = [
    {
      id: 1,
      icon: '⚡',
      title: 'Lightning Fast Payments',
      description: 'Execute bill payments in seconds on Somnia\'s high-speed blockchain network.',
      color: 'yellow',
      benefits: ['Sub-second transactions', 'Real-time confirmation', 'No network congestion']
    },
    {
      id: 2,
      icon: '🤖',
      title: 'AI Financial Assistant',
      description: 'Get personalized insights, spending analysis, and smart recommendations.',
      color: 'blue',
      benefits: ['Spending pattern analysis', 'Budget optimization tips', 'Payment reminders']
    },
    {
      id: 3,
      icon: '🏆',
      title: 'NFT Loyalty Rewards',
      description: 'Earn exclusive NFTs for consistent payment behavior and achievements.',
      color: 'purple',
      benefits: ['5 reward tiers', 'Unique achievements', 'Collectible badges']
    },
    {
      id: 4,
      icon: '🤝',
      title: 'Collaborative Bill Splitting',
      description: 'Create pools to split shared expenses with friends and family.',
      color: 'green',
      benefits: ['Custom split ratios', 'Automatic collection', 'Fair expense sharing']
    },
    {
      id: 5,
      icon: '🔒',
      title: 'Secure Escrow System',
      description: 'Protected payments with confirmation periods and automatic refunds.',
      color: 'red',
      benefits: ['7-day confirmation window', 'Dispute resolution', 'Automatic refunds']
    },
    {
      id: 6,
      icon: '💰',
      title: 'Ultra-Low Fees',
      description: 'Minimal transaction costs powered by Somnia\'s efficient architecture.',
      color: 'orange',
      benefits: ['<$0.01 per transaction', 'No hidden fees', 'Transparent pricing']
    }
  ];

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const featureId = parseInt(entry.target.dataset.featureId);
            setVisibleFeatures((prev) => 
              prev.includes(featureId) ? prev : [...prev, featureId]
            );
          }
        });
      },
      { threshold: 0.1 }
    );

    const featureElements = featuresRef.current?.querySelectorAll('.feature-card');
    featureElements?.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  return (
    <section className="features-section" id="features" ref={featuresRef}>
      <div className="features-container">
        <div className="features-header">
          <div className="section-badge">
            <span className="badge-icon">✨</span>
            <span className="badge-text">Features</span>
          </div>
          <h2 className="section-title">
            Everything You Need for
            <span className="title-highlight"> Smart Bill Management</span>
          </h2>
          <p className="section-description">
            FEEEZ combines cutting-edge blockchain technology with AI intelligence 
            to revolutionize how you handle bills and expenses.
          </p>
        </div>

        <div className="features-grid">
          {features.map((feature, index) => (
            <div
              key={feature.id}
              className={`feature-card ${visibleFeatures.includes(feature.id) ? 'visible' : ''}`}
              data-feature-id={feature.id}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className={`feature-icon ${feature.color}`}>
                <span className="icon-emoji">{feature.icon}</span>
                <div className="icon-glow"></div>
              </div>
              
              <div className="feature-content">
                <h3 className="feature-title">{feature.title}</h3>
                <p className="feature-description">{feature.description}</p>
                
                <ul className="feature-benefits">
                  {feature.benefits.map((benefit, idx) => (
                    <li key={idx} className="benefit-item">
                      <span className="benefit-check">✓</span>
                      <span className="benefit-text">{benefit}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="feature-overlay"></div>
            </div>
          ))}
        </div>

        <div className="features-showcase">
          <div className="showcase-item">
            <div className="showcase-stat">
              <span className="stat-number">99.9%</span>
              <span className="stat-label">Uptime</span>
            </div>
          </div>
          <div className="showcase-item">
            <div className="showcase-stat">
              <span className="stat-number">&lt;1s</span>
              <span className="stat-label">Avg. Transaction Time</span>
            </div>
          </div>
          <div className="showcase-item">
            <div className="showcase-stat">
              <span className="stat-number">$0.001</span>
              <span className="stat-label">Avg. Fee</span>
            </div>
          </div>
          <div className="showcase-item">
            <div className="showcase-stat">
              <span className="stat-number">10K+</span>
              <span className="stat-label">Bills Processed</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Features;
