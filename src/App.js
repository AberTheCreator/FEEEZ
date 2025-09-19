import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Web3Provider } from './context/Web3Context.js';
import { AIProvider } from './context/AIContext.js';
import Header from './components/Layout/Header.js';
import Sidebar from './components/Layout/Sidebar.js';
import Footer from './components/Layout/Footer.js';
import WalletConnect from './components/WalletConnect.js';
import Dashboard from './components/Dashboard.js';
import BillManagement from './components/Form/BillManagement.js';
import AIAssistant from './components/AIAssistant.js';
import NFTRewards from './components/NFTRewards.js';
import BillPools from './components/BillPools.js';
import Landing from './pages/Landing.js';
import { useWeb3 } from './context/Web3Context.js';
import './App.css';

const AppContent = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const { account } = useWeb3();

  if (!account) {
    return <WalletConnect />;
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'bills':
        return <BillManagement />;
      case 'payments':
        return <BillManagement activeView="payments" />;
      case 'pools':
        return <BillPools />;
      case 'nfts':
        return <NFTRewards />;
      case 'ai':
        return <AIAssistant />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="app">
      <Header />
      <div className="app-body">
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
        <main className="main-content">
          {renderContent()}
        </main>
      </div>
      <Footer />
    </div>
  );
};

const AppWithRouter = () => {
  return (
    <Router>
      <Web3Provider>
        <AIProvider>
          <Routes>
      
            <Route path="/" element={<Landing />} />
            
            <Route path="/app" element={<AppContent />} />
            <Route path="/dashboard" element={<Navigate to="/app" replace />} />
            
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AIProvider>
      </Web3Provider>
    </Router>
  );
};

function App() {
  return <AppWithRouter />;
}

export default App;
