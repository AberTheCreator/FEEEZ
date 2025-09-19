import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Landing/Navbar.js';
import Hero from '../components/Landing/Hero.js';
import Features from '../components/Landing/Features.js';
import HowItWorks from '../components/Landing/HowItWorks.js';
import Benefits from '../components/Landing/Benefits.js';
import NetworkHighlight from '../components/Landing/NetworkHighlight.js';
import CTA from '../components/Landing/CTA.js';
import LandingFooter from '../components/Landing/LandingFooter.js';
import './Landing.css';

const Landing = () => {
  const [scrolled, setScrolled] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 50;
      setScrolled(isScrolled);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleGetStarted = () => {
    navigate('/app');
  };

  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="landing-page">
      <Navbar scrolled={scrolled} onGetStarted={handleGetStarted} scrollToSection={scrollToSection} />
      
      <main className="landing-main">
        <Hero onGetStarted={handleGetStarted} />
        <Features />
        <HowItWorks />
        <Benefits />
        <NetworkHighlight />
        <CTA onGetStarted={handleGetStarted} />
      </main>
      
      <LandingFooter />
    </div>
  );
};

export default Landing;
