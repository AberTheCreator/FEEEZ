import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { useWeb3 } from '../context/Web3Context';
import BillPaymentABI from '../contracts/BillPayment.json';
import MockUSDCABI from '../contracts/MockUSDC.json';
import '../App.css';

const BillManagement = () => {
  const { provider, signer, account, contractAddresses } = useWeb3();
  const [bills, setBills] = useState([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('all');
  
  const [newBill, setNewBill] = useState({
    payee: '',
    amount: '',
    frequency: '2592000',
    totalPayments: '12',
    description: '',
    category: 'utilities'
  });

  const categories = {
    utilities: 'Utilities',
    rent: 'Rent/Mortgage',
    insurance: 'Insurance',
    subscriptions: 'Subscriptions',
    loans: 'Loans',
    other: 'Other'
  };

  const frequencies = {
    '604800': 'Weekly',
    '2592000': 'Monthly',
    '7776000': 'Quarterly',
    '31536000': 'Yearly'
  };

  useEffect(() => {
    if (provider && account) {
      loadBills();
    }
  }, [provider, account]);

  const loadBills = async () => {
    try {
      setLoading(true);
      const contract = new ethers.Contract(contractAddresses.billPayment, BillPaymentABI.abi, provider);
      const userBillIds = await contract.getUserBills(account);
      
      const billPromises = userBillIds.map(id => contract.getBill(id));
      const billResults = await Promise.all(billPromises);

      const formattedBills = billResults.map(bill => ({
        billId: bill.billId.toString(),
        payee: bill.payee,
        description: bill.description,
        amount: ethers.utils.formatUnits(bill.amount, 6),
        frequency: bill.frequency.toString(),
        nextPayment: new Date(parseInt(bill.nextPayment.toString()) * 1000),
        totalPayments: bill.totalPayments.toString(),
        completedPayments: bill.completedPayments.toString(),
        status: ['Active', 'Paused', 'Cancelled', 'Completed'][bill.status],
        category: ethers.utils.parseBytes32String(bill.category)
      }));

      setBills(formattedBills);
    } catch (error) {
      console.error('Error loading bills:', error);
    } finally {
      setLoading(false);
    }
  };

  const createBill = async (e) => {
    e.preventDefault();
    if (!newBill.payee || !newBill.amount || !newBill.description) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      
      const contract = new ethers.Contract(contractAddresses.billPayment, BillPaymentABI.abi, signer);
      const usdcContract = new ethers.Contract(contractAddresses.mockUSDC, MockUSDCABI.abi, signer);
      
      const amount = ethers.utils.parseUnits(newBill.amount, 6);
      const categoryBytes = ethers.utils.formatBytes32String(newBill.category);
      
      const currentAllowance = await usdcContract.allowance(account, contractAddresses.billPayment);
      const neededAllowance = amount.mul(newBill.totalPayments);
      
      if (currentAllowance.lt(neededAllowance)) {
        const approveTx = await usdcContract.approve(contractAddresses.billPayment, neededAllowance);
        await approveTx.wait();
      }
      
      const tx = await contract.createBill(
        newBill.payee,
        contractAddresses.mockUSDC,
        amount,
        parseInt(newBill.frequency),
        parseInt(newBill.totalPayments),
        newBill.description,
        categoryBytes
      );

      await tx.wait();
      
      setNewBill({
        payee: '',
        amount: '',
        frequency: '2592000',
        totalPayments: '12',
        description: '',
        category: 'utilities'
      });
      
      setShowCreateForm(false);
      loadBills();
      
    } catch (error) {
      console.error('Error creating bill:', error);
      alert('Failed to create bill: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const updateBillStatus = async (billId, status) => {
    try {
      const contract = new ethers.Contract(contractAddresses.billPayment, BillPaymentABI.abi, signer);
      const statusMap = { 'Active': 0, 'Paused': 1, 'Cancelled': 2 };
      
      const tx = await contract.updateBillStatus(billId, statusMap[status]);
      await tx.wait();
      
      loadBills();
    } catch (error) {
      console.error('Error updating bill status:', error);
      alert('Failed to update bill status: ' + error.message);
    }
  };

  const executeBillPayment = async (billId) => {
    try {
      setLoading(true);
      const contract = new ethers.Contract(contractAddresses.billPayment, BillPaymentABI.abi, signer);
      
      const tx = await contract.executeBillPayment(billId);
      await tx.wait();
      
      loadBills();
      alert('Payment executed successfully!');
    } catch (error) {
      console.error('Error executing payment:', error);
      alert('Failed to execute payment: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const getFilteredBills = () => {
    if (filter === 'all') return bills;
    return bills.filter(bill => bill.status.toLowerCase() === filter);
  };

  const isPaymentDue = (nextPayment) => {
    return nextPayment <= new Date();
  };

  const getDaysUntilPayment = (nextPayment) => {
    const now = new Date();
    const diffTime = nextPayment - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return (
    <div className="bill-management">
      <div className="bill-management-header">
        <div className="header-main">
          <h1>Bill Management</h1>
          <button 
            className="create-bill-btn"
            onClick={() => setShowCreateForm(true)}
          >
            <span className="btn-icon">➕</span>
            Create New Bill
          </button>
        </div>
        
        <div className="filter-tabs">
          <button 
            className={`filter-tab ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All Bills ({bills.length})
          </button>
          <button 
            className={`filter-tab ${filter === 'active' ? 'active' : ''}`}
            onClick={() => setFilter('active')}
          >
            Active ({bills.filter(b => b.status === 'Active').length})
          </button>
          <button 
            className={`filter-tab ${filter === 'paused' ? 'active' : ''}`}
            onClick={() => setFilter('paused')}
          >
            Paused ({bills.filter(b => b.status === 'Paused').length})
          </button>
          <button 
            className={`filter-tab ${filter === 'completed' ? 'active' : ''}`}
            onClick={() => setFilter('completed')}
          >
            Completed ({bills.filter(b => b.status === 'Completed').length})
          </button>
        </div>
      </div>

      {showCreateForm && (
        <div className="modal-overlay">
          <div className="create-bill-modal">
            <div className="modal-header">
              <h2>Create New Bill</h2>
              <button 
                className="close-modal-btn"
                onClick={() => setShowCreateForm(false)}
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={createBill} className="create-bill-form">
              <div className="form-group">
                <label>Payee Address *</label>
                <input
                  type="text"
                  placeholder="0x..."
                  value={newBill.payee}
                  onChange={(e) => setNewBill({...newBill, payee: e.target.value})}
                  required
                />
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label>Amount (USDC) *</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="100.00"
                    value={newBill.amount}
                    onChange={(e) => setNewBill({...newBill, amount: e.target.value})}
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label>Frequency</label>
                  <select
                    value={newBill.frequency}
                    onChange={(e) => setNewBill({...newBill, frequency: e.target.value})}
                  >
                    {Object.entries(frequencies).map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label>Total Payments</label>
                  <input
                    type="number"
                    min="1"
                    value={newBill.totalPayments}
                    onChange={(e) => setNewBill({...newBill, totalPayments: e.target.value})}
                  />
                </div>
                
                <div className="form-group">
                  <label>Category</label>
                  <select
                    value={newBill.category}
                    onChange={(e) => setNewBill({...newBill, category: e.target.value})}
                  >
                    {Object.entries(categories).map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="form-group">
                <label>Description *</label>
                <input
                  type="text"
                  placeholder="e.g., Monthly electricity bill"
                  value={newBill.description}
                  onChange={(e) => setNewBill({...newBill, description: e.target.value})}
                  required
                />
              </div>
              
              <div className="form-actions">
                <button type="button" onClick={() => setShowCreateForm(false)}>
                  Cancel
                </button>
                <button type="submit" disabled={loading}>
                  {loading ? 'Creating...' : 'Create Bill'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="bills-container">
        {loading && bills.length === 0 ? (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Loading your bills...</p>
          </div>
        ) : (
          <>
            {getFilteredBills().length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">📋</div>
                <h3>No bills found</h3>
                <p>Create your first bill to get started with automated payments</p>
                <button 
                  className="create-first-bill-btn"
                  onClick={() => setShowCreateForm(true)}
                >
                  Create Your First Bill
                </button>
              </div>
            ) : (
              <div className="bills-grid">
                {getFilteredBills().map(bill => {
                  const isDue = isPaymentDue(bill.nextPayment);
                  const daysUntil = getDaysUntilPayment(bill.nextPayment);
                  
                  return (
                    <div key={bill.billId} className={`bill-card ${bill.status.toLowerCase()} ${isDue ? 'due' : ''}`}>
                      <div className="bill-header">
                        <div className="bill-title">
                          <h3>{bill.description}</h3>
                          <span className={`status-badge ${bill.status.toLowerCase()}`}>
                            {bill.status}
                          </span>
                        </div>
                        <div className="bill-amount">
                          ${parseFloat(bill.amount).toFixed(2)}
                        </div>
                      </div>
                      
                      <div className="bill-details">
                        <div className="detail-row">
                          <span className="detail-label">Category</span>
                          <span className="detail-value">{categories[bill.category] || bill.category}</span>
                        </div>
                        
                        <div className="detail-row">
                          <span className="detail-label">Frequency</span>
                          <span className="detail-value">{frequencies[bill.frequency] || 'Custom'}</span>
                        </div>
                        
                        <div className="detail-row">
                          <span className="detail-label">Progress</span>
                          <span className="detail-value">
                            {bill.completedPayments} / {bill.totalPayments} payments
                          </span>
                        </div>
                        
                        <div className="detail-row">
                          <span className="detail-label">Next Payment</span>
                          <span className={`detail-value ${isDue ? 'due-now' : ''}`}>
                            {isDue ? 'Due Now!' : daysUntil > 0 ? `${daysUntil} days` : 'Overdue'}
                          </span>
                        </div>
                      </div>
                      
                      <div className="bill-progress">
                        <div className="progress-bar">
                          <div 
                            className="progress-fill"
                            style={{ 
                              width: `${(parseInt(bill.completedPayments) / parseInt(bill.totalPayments)) * 100}%` 
                            }}
                          />
                        </div>
                      </div>
                      
                      <div className="bill-actions">
                        {bill.status === 'Active' && isDue && (
                          <button 
                            className="pay-now-btn"
                            onClick={() => executeBillPayment(bill.billId)}
                            disabled={loading}
                          >
                            Pay Now
                          </button>
                        )}
                        
                        {bill.status === 'Active' && (
                          <button 
                            className="pause-btn"
                            onClick={() => updateBillStatus(bill.billId, 'Paused')}
                          >
                            Pause
                          </button>
                        )}
                        
                        {bill.status === 'Paused' && (
                          <button 
                            className="resume-btn"
                            onClick={() => updateBillStatus(bill.billId, 'Active')}
                          >
                            Resume
                          </button>
                        )}
                        
                        {(bill.status === 'Active' || bill.status === 'Paused') && (
                          <button 
                            className="cancel-btn"
                            onClick={() => updateBillStatus(bill.billId, 'Cancelled')}
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                      
                      <div className="bill-payee">
                        <span className="payee-label">Payee:</span>
                        <span className="payee-address">
                          {bill.payee.slice(0, 6)}...{bill.payee.slice(-4)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default BillManagement;