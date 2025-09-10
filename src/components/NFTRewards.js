import React from 'react';
import useNFTRewards from './hooks/useNFTRewards';

const NFTRewards = () => {
  const { 
    nfts, 
    stats, 
    loading, 
    claimReward 
  } = useNFTRewards();

  const tierInfo = {
    0: { name: 'Bronze', emoji: '🥉', color: '#CD7F32' },
    1: { name: 'Silver', emoji: '🥈', color: '#C0C0C0' },
    2: { name: 'Gold', emoji: '🥇', color: '#FFD700' },
    3: { name: 'Platinum', emoji: '🏆', color: '#E5E4E2' },
    4: { name: 'Diamond', emoji: '💎', color: '#B9F2FF' }
  };

  const handleClaimReward = async () => {
    try {
      await claimReward();
      alert('NFT reward claimed successfully!');
    } catch (error) {
      console.error('Error claiming reward:', error);
      alert('Failed to claim reward: ' + error.message);
    }
  };

  if (loading) {
    return (
      <div className="nft-rewards">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading your NFT rewards...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="nft-rewards">
      <div className="rewards-header">
        <h2>🏆 NFT Rewards</h2>
        <p>Earn loyalty NFTs for consistent bill payments</p>
        <button 
          onClick={handleClaimReward} 
          className="claim-reward-btn"
          disabled={loading}
        >
          {loading ? 'Claiming...' : 'Claim Reward'}
        </button>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">🏆</div>
          <div className="stat-content">
            <h3>{stats.totalNFTs}</h3>
            <p>NFTs Earned</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">💳</div>
          <div className="stat-content">
            <h3>{stats.totalPayments}</h3>
            <p>Total Payments</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">🔥</div>
          <div className="stat-content">
            <h3>{stats.currentStreak}</h3>
            <p>Current Streak</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">💰</div>
          <div className="stat-content">
            <h3>${stats.totalSaved?.toFixed(2) || '0.00'}</h3>
            <p>Total Saved</p>
          </div>
        </div>
      </div>

      <div className="nft-section">
        <h3>Your NFT Collection</h3>
        {nfts.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🏆</div>
            <h4>No NFTs Yet</h4>
            <p>Keep paying bills consistently to earn your first NFT reward!</p>
          </div>
        ) : (
          <div className="nft-grid">
            {nfts.map(nft => (
              <div key={nft.tokenId} className="nft-card">
                <div 
                  className="nft-image" 
                  style={{ 
                    background: `linear-gradient(135deg, ${tierInfo[nft.tier]?.color}20, ${tierInfo[nft.tier]?.color}40)` 
                  }}
                >
                  <div className="nft-tier-emoji">{tierInfo[nft.tier]?.emoji}</div>
                  <div className="nft-id">#{nft.tokenId}</div>
                </div>
                <div className="nft-info">
                  <h4>{tierInfo[nft.tier]?.name} Reward</h4>
                  <div className="nft-details">
                    <div className="detail-item">
                      <span className="detail-label">Tier:</span>
                      <span className="detail-value">{tierInfo[nft.tier]?.name}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Payments:</span>
                      <span className="detail-value">{nft.paymentsCount}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Minted:</span>
                      <span className="detail-value">{nft.mintDate?.toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="tier-info">
        <h3>Reward Tiers</h3>
        <div className="tier-list">
          {Object.entries(tierInfo).map(([tier, info]) => (
            <div key={tier} className="tier-item">
              <div className="tier-emoji">{info.emoji}</div>
              <div>
                <div className="tier-name">{info.name}</div>
                <div className="tier-requirement">Tier {parseInt(tier) + 1}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default NFTRewards;