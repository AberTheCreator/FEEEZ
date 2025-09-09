import React from 'react';

const Footer = () => {
  return (
    <footer style={{ 
      textAlign: 'center', 
      padding: '2rem', 
      color: 'rgba(255,255,255,0.6)',
      fontSize: '0.9rem'
    }}>
      <p>© 2024 FEEEZ - Decentralized Bill Payments on Somnia Network</p>
      <div style={{ marginTop: '0.5rem', display: 'flex', justifyContent: 'center', gap: '2rem' }}>
        <a href="#" style={{ color: 'rgba(255,255,255,0.6)', textDecoration: 'none' }}>Privacy</a>
        <a href="#" style={{ color: 'rgba(255,255,255,0.6)', textDecoration: 'none' }}>Terms</a>
        <a href="#" style={{ color: 'rgba(255,255,255,0.6)', textDecoration: 'none' }}>Support</a>
      </div>
    </footer>
  );
};

export default Footer;