import React, { useState } from 'react';
import useBillPools from './hooks/useBillPools.js';

const BillPools = () => {
  const { 
    pools, 
    myPools, 
    loading, 
    createPool, 
    joinPool, 
    executePayment 
  } = useBillPools();

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [activeTab, setActiveTab] = useState('available');
  const [newPool, setNewPool] = useState({
    description: '',
    targetAmount: '',
    deadline: '',
    minContribution: '',
    maxContribution: ''
  });

  const handleCreatePool = async (e) => {
    e.preventDefault();
    try {
      await createPool(newPool);
      setShowCreateForm(false);
      setNewPool({
        description: '',
        targetAmount: '',
        deadline: '',
        minContribution: '',
        maxContribution: ''
      });
    } catch (error) {
      console.error('Error creating pool:', error);
      alert('Failed to create pool: ' + error.message);
    }
  };

  const handleJoinPool = async (poolId, amount) => {
    try {
      await joinPool(poolId, amount);
      alert('Successfully joined pool!');
    } catch (error) {
      console.error('Error joining pool:', error);
      alert('Failed to join pool: ' + error.message);
    }
  };

  const getDisplayPools = () => {
    if (activeTab === 'available') {
      return pools.filter(pool => pool.isActive && !pool.isCompleted);
    } else {
      return myPools;
    }
  };

  return (
    <div className="bill-pools">
      <div className="pools-header">
        <div>
          <h2>Bill Pools</h2>
          <p>Split bills with friends and family</p>
        </div>
        <button 
          className="create-pool-button"
          onClick={() => setShowCreateForm(true)}
        >
          Create Pool
        </button>
      </div>

      <div className="tabs">
        <button 
          className={`tab ${activeTab === 'available' ? 'active' : ''}`}
          onClick={() => setActiveTab('available')}
        >
          Available Pools ({pools.length})
        </button>
        <button 
          className={`tab ${activeTab === 'my-pools' ? 'active' : ''}`}
          onClick={() => setActiveTab('my-pools')}
        >
          My Pools ({myPools.length})
        </button>
      </div>

      {showCreateForm && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Create New Pool</h3>
              <button 
                className="close-button"
                onClick={() => setShowCreateForm(false)}
              >
                ×
              </button>
            </div>
            <form onSubmit={handleCreatePool} className="modal-body">
              <div className="form-group">
                <label>Pool Description</label>
                <input
                  type="text"
                  value={newPool.description}
                  onChange={(e) => setNewPool({...newPool, description: e.target.value})}
                  placeholder="e.g., Shared apartment electricity bill"
                  required
                />
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label>Target Amount (USDC)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={newPool.targetAmount}
                    onChange={(e) => setNewPool({...newPool, targetAmount: e.target.value})}
                    placeholder="100.00"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Deadline</label>
                  <input
                    type="date"
                    value={newPool.deadline}
                    onChange={(e) => setNewPool({...newPool, deadline: e.target.value})}
                    min={new Date().toISOString().split('T')[0]}
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Min Contribution</label>
                  <input
                    type="number"
                    step="0.01"
                    value={newPool.minContribution}
                    onChange={(e) => setNewPool({...newPool, minContribution: e.target.value})}
                    placeholder="10.00"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Max Contribution</label>
                  <input
                    type="number"
                    step="0.01"
                    value={newPool.maxContribution}
                    onChange={(e) => setNewPool({...newPool, maxContribution: e.target.value})}
                    placeholder="200.00"
                    required
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="cancel-button" onClick={() => setShowCreateForm(false)}>
                  Cancel
                </button>
                <button type="submit" className="create-button" disabled={loading}>
                  {loading ? 'Creating...' : 'Create Pool'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="pools-grid">
        {loading && pools.length === 0 ? (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Loading pools...</p>
          </div>
        ) : getDisplayPools().length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🏊</div>
            <h4>No pools found</h4>
            <p>
              {activeTab === 'available' 
                ? 'No pools available. Create one to get started!'
                : 'You haven\'t created any pools yet.'
              }
            </p>
          </div>
        ) : (
          getDisplayPools().map(pool => (
            <div key={pool.id} className="pool-card">
              <div className="pool-header">
                <h3>{pool.description}</h3>
              </div>
              
              <div className="pool-progress">
                <div className="progress-bar">
                  <div 
                    className="progress-fill" 
                    style={{ 
                      width: `${(pool.currentAmount / pool.targetAmount) * 100}%` 
                    }}
                  ></div>
                </div>
                <div className="progress-text">
                  ${pool.currentAmount} / ${pool.targetAmount}
                </div>
              </div>
              
              <div className="pool-info">
                <div className="info-item">
                  <strong>Deadline:</strong> {pool.dueDate.toLocaleDateString()}
                </div>
                <div className="info-item">
                  <strong>Members:</strong> {pool.memberCount}/{pool.maxMembers}
                </div>
                <div className="info-item">
                  <strong>Status:</strong> {pool.isCompleted ? 'Completed' : 'Active'}
                </div>
              </div>
              
              {!pool.isCompleted && pool.creator !== pool.creator && (
                <button 
                  className="join-pool-button"
                  onClick={() => handleJoinPool(pool.id, 0)}
                  disabled={loading}
                >
                  Join Pool
                </button>
              )}

              {pool.isCompleted && pool.creator === pool.creator && (
                <button 
                  className="execute-payment-button"
                  onClick={() => executePayment(pool.id)}
                  disabled={loading}
                >
                  Execute Payment
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default BillPools;