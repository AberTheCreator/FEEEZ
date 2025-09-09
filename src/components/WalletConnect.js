import React from 'react';
import './WalletConnection.css';

const WalletConnection = ({ onConnect }) => {
  return (
    <div className="wallet-connection">
      <div className="connection-container">
        <div className="connection-header">
          <div className="app-logo">
            <div className="logo-circle">
              <span className="logo-icon">💸</span>
            </div>
            <h1 className="app-title">FEEEZ</h1>
            <p className="app-subtitle">Bills Paid. Fees Gone.</p>
          </div>
        </div>

        <div className="connection-content">
          <div className="feature-preview">
            <div className="feature-card">
              <span className="feature-icon"> </span>
              <h3>Lightning Fast Payments</h3>
              <p>Pay bills instantly on Somnia's ultra-fast blockchain</p>
            </div>
            
            <div className="feature-card">
              <span className="feature-icon"> </span>
              <h3>AI Financial Assistant</h3>
              <p>Get smart insights and payment reminders</p>
            </div>
            
            <div className="feature-card">
              <span className="feature-icon">🏆</span>
              <h3>NFT Rewards</h3>
              <p>Earn loyalty NFTs for consistent bill payments</p>
            </div>
            
            <div className="feature-card">
              <span className="feature-icon">🤝</span>
              <h3>Bill Splitting</h3>
              <p>Share bills with friends and family</p>
            </div>
          </div>

          <div className="connection-actions">
            <button className="connect-button" onClick={onConnect}>
              <span className="button-icon">🔗</span>
              <span className="button-text">Connect Wallet</span>
            </button>
            
            <div className="supported-wallets">
              <p>Supported wallets:</p>
              <div className="wallet-icons">
                <div className="wallet-icon">🦊 MetaMask</div>
                <div className="wallet-icon">👛 WalletConnect</div>
                <div className="wallet-icon">🔷 Coinbase</div>
              </div>
            </div>
          </div>
        </div>

        <div className="connection-benefits">
          <div className="benefit-item">
            <span className="benefit-icon">🔒</span>
            <div className="benefit-text">
              <h4>Secure & Non-custodial</h4>
              <p>Your funds stay in your wallet</p>
            </div>
          </div>
          
          <div className="benefit-item">
            <span className="benefit-icon">💰</span>
            <div className="benefit-text">
              <h4>Low Fees</h4>
              <p>Minimal transaction costs on Somnia</p>
            </div>
          </div>
          
          <div className="benefit-item">
            <span className="benefit-icon">🌍</span>
            <div className="benefit-text">
              <h4>Global Payments</h4>
              <p>Pay bills anywhere in the world</p>
            </div>
          </div>
        </div>

        <div className="connection-footer">
          <p>By connecting your wallet, you agree to our Terms of Service</p>
          <div className="network-info">
            <span className="network-badge">
              <span className="network-dot"></span>
              Somnia Network
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WalletConnection;