import React from 'react';
import { useWeb3 } from '../../context/Web3Context';



const Header = () => {
  const { account, balance, network, disconnectWallet } = useWeb3();

  const formatAddress = (address) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatBalance = (balance) => {
    if (!balance) return '0.00';
    return parseFloat(balance).toFixed(2);
  };

  return (
    <header className="app-header">
      <div className="header-content">
        <div className="logo-section">
          <div className="logo-circle" style={{ width: '40px', height: '40px', marginRight: '12px' }}>
            <img src="/logo192.png" alt="Feeez Logo" className="h-8 w-8" style={{ width: '32px', height: '32px' }} />
            
          </div>
          <div>
            <h1 className="app-title" style={{ fontSize: '1.5rem', marginBottom: '0' }}>FEEEZ</h1>
            <p className="app-subtitle">Bills Paid. Fees Gone.</p>
          </div>
        </div>
        
        <div className="header-actions" style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {account && (
            <>
              <div className="network-info" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div className="network-dot"></div>
                <span style={{ color: 'rgba(255,255,255,0.9)', fontSize: '0.9rem' }}>
                  {network?.name || 'Unknown'}
                </span>
              </div>
              
              <div className="balance-info" style={{ color: 'rgba(255,255,255,0.9)', fontSize: '0.9rem' }}>
                {formatBalance(balance)} ETH
              </div>
              
              <div className="account-info" style={{ 
                background: 'rgba(255,255,255,0.1)', 
                padding: '0.5rem 1rem', 
                borderRadius: '20px',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <span style={{ color: 'white', fontSize: '0.9rem' }}>
                  {formatAddress(account)}
                </span>
                <button 
                  onClick={disconnectWallet}
                  style={{
                    background: 'rgba(255,255,255,0.2)',
                    border: 'none',
                    color: 'white',
                    padding: '0.25rem 0.5rem',
                    borderRadius: '12px',
                    fontSize: '0.8rem',
                    cursor: 'pointer'
                  }}
                >
                  Disconnect
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;