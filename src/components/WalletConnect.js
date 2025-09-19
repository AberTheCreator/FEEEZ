import React, { useState, useEffect } from 'react';
import { useWeb3 } from '../context/Web3Context.js';

const WalletConnect = () => {
  const { 
    connectWallet, 
    connecting, 
    error, 
    isConnected, 
    account, 
    network,
    isSupportedNetwork,
    switchToSomniaNetwork 
  } = useWeb3();
  
  const [isConnecting, setIsConnecting] = useState(false);
  const [showNetworkWarning, setShowNetworkWarning] = useState(false);

  
  useEffect(() => {
    if (isConnected && !isSupportedNetwork) {
      setShowNetworkWarning(true);
    } else {
      setShowNetworkWarning(false);
    }
  }, [isConnected, isSupportedNetwork]);

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

  const handleNetworkSwitch = async () => {
    try {
      await switchToSomniaNetwork();
      setShowNetworkWarning(false);
    } catch (err) {
      console.error('Network switch failed:', err);
    }
  };

  
  if (isConnected && isSupportedNetwork) {
    return (
      <div className="wallet-connect">
        <div className="connect-container">
          <div className="connect-card connected">
            <div className="logo-section">
              <div className="logo-circle">
                <img src="/logo192.png" alt="FEEEZ Logo" className="wallet-logo" />
              </div>
              <h1 className="app-name">FEEEZ</h1>
              <p className="tagline">Bills Paid. Fees Gone.</p>
            </div>
            
            <div className="connection-success">
              <div className="success-icon">✅</div>
              <p className="success-message">Wallet Connected Successfully!</p>
              <p className="account-info">
                {account?.substring(0, 6)}...{account?.substring(account.length - 4)}
              </p>
              <div className="network-badge connected">
                <div className="network-dot active"></div>
                <span>{network?.name || 'Somnia Testnet'}</span>
              </div>
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
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="wallet-connect">
      <div className="connect-container">
        <div className="connect-card">
          <div className="logo-section">
            <div className="logo-circle">
              <img src="/logo192.png" alt="FEEEZ Logo" className="wallet-logo" />
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

         
          {!window.ethereum && (
            <div className="warning-message">
              <span className="warning-icon">⚠️</span>
              <div>
                <p><strong>MetaMask Required</strong></p>
                <p>Please install MetaMask to use FEEEZ</p>
                <a 
                  href="https://metamask.io/download/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="install-link"
                >
                  Install MetaMask →
                </a>
              </div>
            </div>
          )}

         
          {showNetworkWarning && (
            <div className="warning-message network-warning">
              <span className="warning-icon">🌐</span>
              <div>
                <p><strong>Wrong Network</strong></p>
                <p>Please switch to Somnia Testnet</p>
                <button 
                  className="switch-network-button"
                  onClick={handleNetworkSwitch}
                >
                  Switch to Somnia
                </button>
              </div>
            </div>
          )}

          
          {error && (
            <div className="error-message">
              <span className="error-icon">❌</span>
              <div>
                <p><strong>Connection Error</strong></p>
                <p>{error}</p>
                {error.includes('testnet') && (
                  <div className="help-links">
                    <a 
                      href="https://discord.com/invite/Somnia" 
                      target="_blank" 
                      rel="noopener noreferrer"
                    >
                      Get STT Tokens →
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}

         
          {window.ethereum && !showNetworkWarning && (
            <button 
              className="connect-button" 
              onClick={handleConnect}
              disabled={connecting || isConnecting}
            >
              {connecting || isConnecting ? (
                <>
                  <span className="loading-spinner">⏳</span>
                  Connecting...
                </>
              ) : (
                <>
                  <span className="wallet-icon">🦊</span>
                  Connect MetaMask
                </>
              )}
            </button>
          )}

          <div className="network-info">
            <p>Powered by Somnia Network</p>
            <div className={`network-badge ${isSupportedNetwork ? 'connected' : ''}`}>
              <div className={`network-dot ${isSupportedNetwork ? 'active' : ''}`}></div>
              <span>Somnia Testnet</span>
            </div>
            
            
            <div className="help-links">
              <a 
                href="https://shannon-explorer.somnia.network" 
                target="_blank" 
                rel="noopener noreferrer"
                className="help-link"
              >
                Block Explorer
              </a>
              <span className="divider">•</span>
              <a 
                href="https://discord.com/invite/Somnia" 
                target="_blank" 
                rel="noopener noreferrer"
                className="help-link"
              >
                Get STT Tokens
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WalletConnect;
