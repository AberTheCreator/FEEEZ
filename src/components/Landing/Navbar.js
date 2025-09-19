import React, { useState } from 'react';

const Navbar = ({ scrolled, onGetStarted, scrollToSection }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const handleNavClick = (sectionId) => {
    scrollToSection(sectionId);
    setMobileMenuOpen(false);
  };

  return (
    <nav className={`landing-navbar ${scrolled ? 'scrolled' : ''}`}>
      <div className="navbar-container">
        </div>
        <div className="navbar-brand">
          <div className="brand-logo">
           <img src="/logo192.png" alt="FEEEZ Logo" className="brand-logo-img" />
               <span className="brand-text">FEEEZ</span>
        </div>

        <div className={`navbar-menu ${mobileMenuOpen ? 'mobile-open' : ''}`}>
          <button 
            className="nav-link"
            onClick={() => handleNavClick('features')}
          >
            Features
          </button>
          <button 
            className="nav-link"
            onClick={() => handleNavClick('how-it-works')}
          >
            How It Works
          </button>
          <button 
            className="nav-link"
            onClick={() => handleNavClick('benefits')}
          >
            Benefits
          </button>
          <button 
            className="nav-link"
            onClick={() => handleNavClick('network')}
          >
            Network
          </button>
          
          <div className="navbar-actions">
            <a 
              href="https://docs.feeez.app" 
              target="_blank" 
              rel="noopener noreferrer"
              className="nav-link-external"
            >
              Docs
            </a>
            <button 
              className="get-started-btn"
              onClick={onGetStarted}
            >
              Get Started
            </button>
          </div>
        </div>

        <button 
          className="mobile-menu-toggle"
          onClick={toggleMobileMenu}
          aria-label="Toggle mobile menu"
        >
          <span className={`hamburger ${mobileMenuOpen ? 'open' : ''}`}>
            <span></span>
            <span></span>
            <span></span>
          </span>
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
