import React from 'react';

const Benefits = () => {
  const benefits = [
    {
      icon: '⚡',
      title: 'Lightning Fast',
      description: 'Sub-second transactions on Somnia Network',
      stats: '<1s avg time'
    },
    {
      icon: '💰',
      title: 'Ultra Low Fees',
      description: 'Minimal transaction costs',
      stats: '<$0.01 per tx'
    },
    {
      icon: '🔒',
      title: 'Secure Escrow',
      description: 'Protected payments with confirmations',
      stats: '99.9% safe'
    },
    {
      icon: '🏆',
      title: 'Earn Rewards',
      description: 'NFT rewards for consistent payments',
      stats: '5 reward tiers'
    }
  ];

  return (
    <section className="benefits-section" id="benefits">
      <div className="benefits-container">
        <div className="section-header">
          <h2>Why Choose FEEEZ?</h2>
          <p>Experience the future of bill payments</p>
        </div>
        <div className="benefits-grid">
          {benefits.map((benefit, index) => (
            <div key={index} className="benefit-card">
              <div className="benefit-icon">{benefit.icon}</div>
              <h3>{benefit.title}</h3>
              <p>{benefit.description}</p>
              <div className="benefit-stat">{benefit.stats}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Benefits;
