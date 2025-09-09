import React from 'react';

const Sidebar = ({ activeTab, setActiveTab }) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'bills', label: 'Bills', icon: '📋' },
    { id: 'payments', label: 'Payments', icon: '💰' },
    { id: 'pools', label: 'Bill Pools', icon: '👥' },
    { id: 'nfts', label: 'NFT Rewards', icon: '🏆' },
    { id: 'ai', label: 'AI Assistant', icon: '🤖' }
  ];

  return (
    <aside className="sidebar">
      <nav>
        {navItems.map(item => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
          >
            <span className="nav-icon">{item.icon}</span>
            <span className="nav-label">{item.label}</span>
          </button>
        ))}
      </nav>
    </aside>
  );
};

export default Sidebar;