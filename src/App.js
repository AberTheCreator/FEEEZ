import React, { useState } from 'react';
import { Web3Provider } from './context/Web3Context';
import { AIProvider } from './context/AIContext';
import Header from './components/Layout/Header';
import Sidebar from './components/Layout/Sidebar';
import Footer from './components/Layout/Footer';
import WalletConnect from './components/WalletConnect';
import Dashboard from './components/Dashboard';
import BillManagement from './components/Form/BillManagement';
import AIAssistant from './components/AIAssistant';
import NFTRewards from './components/NFTRewards';
import BillPools from './components/BillPools';
import { useWeb3 } from './context/Web3Context';
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

function App() {
  return (
    <Web3Provider>
      <AIProvider>
        <AppContent />
      </AIProvider>
    </Web3Provider>
  );
}

export default App;