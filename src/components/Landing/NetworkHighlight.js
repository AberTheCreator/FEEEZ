import React from 'react';

const NetworkHighlight = () => {
  return (
    <section className="network-section" id="network">
      <div className="network-container">
        <div className="network-content">
          <div className="network-info">
            <div className="section-badge">
              <span className="badge-icon">⚡</span>
              <span className="badge-text">Powered by Somnia</span>
            </div>
            <h2>Built on the Fastest EVM Chain</h2>
            <p>FEEEZ leverages Somnia Network's revolutionary blockchain technology to deliver unmatched performance for decentralized bill payments.</p>
            
            <div className="network-stats">
              <div className="stat-item">
                <div className="stat-number">400k+</div>
                <div className="stat-label">TPS Capability</div>
              </div>
              <div className="stat-item">
                <div className="stat-number">100ms</div>
                <div className="stat-label">Block Time</div>
              </div>
              <div className="stat-item">
                <div className="stat-number">$0.001</div>
                <div className="stat-label">Avg Fee</div>
              </div>
            </div>
          </div>
          
          <div className="network-visual">
            <div className="network-diagram">
              <div className="network-node">
                <span>🌐</span>
                <label>Somnia Network</label>
              </div>
              <div className="network-connections">
                <div className="connection-line"></div>
                <div className="connection-line"></div>
                <div className="connection-line"></div>
              </div>
              <div className="network-apps">
                <div className="app-node">
                  <span>💸</span>
                  <label>FEEEZ</label>
                </div>
                <div className="app-node">
                  <span>🤖</span>
                  <label>AI Engine</label>
                </div>
                <div className="app-node">
                  <span>🏆</span>
                  <label>NFT Rewards</label>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default NetworkHighlight;
