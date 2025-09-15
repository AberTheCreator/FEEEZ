import React, { useState } from 'react';
import { useWeb3 } from '../context/Web3Context';

const WalletConnect = () => {
  const { connectWallet, connecting, error } = useWeb3();
  const [isConnecting, setIsConnecting] = useState(false);

  const handleConnect = async () => {
    setIsConnecting(true);
    try {
      await connectWallet();
    } catch (err) {
      console.error('Connection failed:', err);
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <div className="wallet-connect">
      <div className="connect-container">
        <div className="connect-card">
          <div className="logo-section">
            <div className="logo-circle">
              <span className="logo-text">💸</span>
            </div>
            <h1 className="app-name">FEEEZ</h1>
            <p className="tagline">Bills Paid. Fees Gone.</p>
          </div>

          <div className="features-preview">
            <div className="feature-item">
              <span className="feature-icon">⚡</span>
              <span className="feature-text">Lightning Fast Payments</span>
            </div>
            
            <div className="feature-item">
              <span className="feature-icon">🤖</span>
              <span className="feature-text">AI Financial Assistant</span>
            </div>
            
            <div className="feature-item">
              <span className="feature-icon">🏆</span>
              <span className="feature-text">NFT Rewards</span>
            </div>
            
            <div className="feature-item">
              <span className="feature-icon">🤝</span>
              <span className="feature-text">Bill Splitting</span>
            </div>
          </div>

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <button 
            className="connect-button" 
            onClick={handleConnect}
            disabled={connecting || isConnecting}
          >
            {connecting || isConnecting ? 'Connecting...' : 'Connect Wallet'}
          </button>

          <div className="network-info">
            <p>Powered by Somnia Network</p>
            <div className="network-badge">
              <div className="network-dot"></div>
              <span>Somnia Testnet</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WalletConnect;
