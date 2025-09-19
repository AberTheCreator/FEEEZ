import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { useWeb3 } from '../context/Web3Context.js';

const BILL_PAYMENT_ABI = [
  "function createBill(address payee, address token, uint256 amount, uint256 frequency, uint256 totalPayments, string memory description, bytes32 category) external returns (uint256)",
  "function executeBillPayment(uint256 billId) external",
  "function updateBillStatus(uint256 billId, uint8 status) external",
  "function getBill(uint256 billId) external view returns (tuple(uint256 billId, address payer, address payee, address token, uint256 amount, uint256 frequency, uint256 nextPayment, uint256 totalPayments, uint256 completedPayments, uint8 status, string description, bytes32 category))",
  "function getUserBills(address user) external view returns (uint256[])",
  "event BillCreated(uint256 indexed billId, address indexed payer, address indexed payee, uint256 amount)"
];

const MOCK_USDC_ABI = [
  "function balanceOf(address account) external view returns (uint256)",
  "function allowance(address owner, address spender) external view returns (uint256)", 
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function decimals() external view returns (uint8)"
];

const BillManagement = ({ activeView = "bills" }) => {
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
    if (provider && account && contractAddresses?.billPayment) {
      loadBills();
    }
  }, [provider, account, contractAddresses]);

  const loadBills = async () => {
    try {
      setLoading(true);
      
      if (!contractAddresses.billPayment || contractAddresses.billPayment === "0x0000000000000000000000000000000000000000") {
        console.warn('Bill Payment contract address not configured');
        setBills([]);
        setLoading(false);
        return;
      }

      const contract = new ethers.Contract(contractAddresses.billPayment, BILL_PAYMENT_ABI, provider);
      const userBillIds = await contract.getUserBills(account);
      
      const billPromises = userBillIds.map(async (id) => {
        try {
          return await contract.getBill(id);
        } catch (error) {
          console.error(`Error fetching bill ${id}:`, error);
          return null;
        }
      });
      
      const billResults = await Promise.all(billPromises);

      const formattedBills = billResults
        .filter(bill => bill !== null)
        .map(bill => ({
          billId: bill.billId.toString(),
          payee: bill.payee,
          description: bill.description,
          amount: ethers.utils.formatUnits(bill.amount, 6),
          frequency: bill.frequency.toString(),
          nextPayment: new Date(parseInt(bill.nextPayment.toString()) * 1000),
          totalPayments: bill.totalPayments.toString(),
          completedPayments: bill.completedPayments.toString(),
          status: ['Active', 'Paused', 'Cancelled', 'Completed'][bill.status],
          category: bill.category ? ethers.utils.parseBytes32String(bill.category) : 'other'
        }));

      setBills(formattedBills);
    } catch (error) {
      console.error('Error loading bills:', error);
      setBills([]);
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
      
      if (!contractAddresses.billPayment || contractAddresses.billPayment === "0x0000000000000000000000000000000000000000") {
        alert('Bill Payment contract not deployed. Please deploy contracts first.');
        return;
      }

      const contract = new ethers.Contract(contractAddresses.billPayment, BILL_PAYMENT_ABI, signer);
      const usdcContract = new ethers.Contract(contractAddresses.mockUSDC, MOCK_USDC_ABI, signer);
      
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
      
      alert('Bill created successfully!');
    } catch (error) {
      console.error('Error creating bill:', error);
      alert('Failed to create bill: ' + (error.reason || error.message));
    } finally {
      setLoading(false);
    }
  };

  const executeBillPayment = async (billId) => {
    try {
      setLoading(true);
      
      const contract = new ethers.Contract(contractAddresses.billPayment, BILL_PAYMENT_ABI, signer);
      const tx = await contract.executeBillPayment(billId);
      await tx.wait();
      
      alert('Payment executed successfully!');
      loadBills();
    } catch (error) {
      console.error('Error executing payment:', error);
      alert('Failed to execute payment: ' + (error.reason || error.message));
    } finally {
      setLoading(false);
    }
  };

  const getFilteredBills = () => {
    if (filter === 'all') return bills;
    if (filter === 'active') return bills.filter(bill => bill.status === 'Active');
    if (filter === 'due') {
      const now = new Date();
      return bills.filter(bill => bill.status === 'Active' && bill.nextPayment <= now);
    }
    return bills.filter(bill => bill.status === filter);
  };

  const formatNextPayment = (date) => {
    const now = new Date();
    const diffTime = date - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return 'Overdue';
    if (diffDays === 0) return 'Due today';
    if (diffDays === 1) return 'Due tomorrow';
    return `Due in ${diffDays} days`;
  };

  if (!contractAddresses.billPayment || contractAddresses.billPayment === "0x0000000000000000000000000000000000000000") {
    return (
      <div style={{ textAlign: 'center', padding: '3rem' }}>
        <h2>💸 Welcome to FEEEZ Bill Management!</h2>
        <p style={{ marginBottom: '2rem' }}>
          To get started, you need to deploy the smart contracts first.
        </p>
        <div style={{ 
          background: '#f8fafc', 
          padding: '1.5rem', 
          borderRadius: '12px', 
          textAlign: 'left',
          maxWidth: '500px',
          margin: '0 auto'
        }}>
          <h4 style={{ color: '#333', marginBottom: '1rem' }}>Quick Setup:</h4>
          <ol style={{ paddingLeft: '1.5rem', lineHeight: '1.6' }}>
            <li>Deploy contracts: <code style={{ background: '#e5e7eb', padding: '0.25rem 0.5rem', borderRadius: '4px' }}>npm run deploy</code></li>
            <li>Update your .env file with contract addresses</li>
            <li>Refresh this page</li>
          </ol>
        </div>
      </div>
    );
  }

  return (
    <div className="bill-management" style={{ padding: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h2 style={{ margin: '0 0 0.5rem 0', fontSize: '1.8rem', color: '#333' }}>
            {activeView === 'bills' ? 'My Bills' : 'Payment History'}
          </h2>
          <p style={{ margin: 0, color: '#666' }}>
            {activeView === 'bills' ? 'Manage your recurring and one-time bills' : 'View your payment transactions'}
          </p>
        </div>
        
        {activeView === 'bills' && (
          <button 
            onClick={() => setShowCreateForm(true)}
            style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              border: 'none',
              padding: '0.75rem 1.5rem',
              borderRadius: '12px',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            <span>➕</span>
            Create Bill
          </button>
        )}
      </div>

      <div style={{ 
        display: 'flex', 
        gap: '1rem', 
        marginBottom: '2rem',
        borderBottom: '1px solid #e5e7eb',
        paddingBottom: '1rem'
      }}>
        {['all', 'active', 'due', 'completed'].map(filterType => (
          <button
            key={filterType}
            onClick={() => setFilter(filterType)}
            style={{
              padding: '0.5rem 1rem',
              border: 'none',
              background: filter === filterType ? '#667eea' : 'transparent',
              color: filter === filterType ? 'white' : '#666',
              borderRadius: '8px',
              cursor: 'pointer',
              textTransform: 'capitalize',
              fontWeight: filter === filterType ? '600' : '400'
            }}
          >
            {filterType} {filterType === 'due' ? `(${bills.filter(b => b.status === 'Active' && b.nextPayment <= new Date()).length})` : ''}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem' }}>
          <div style={{ 
            width: '40px', 
            height: '40px', 
            border: '3px solid #f3f4f6', 
            borderTop: '3px solid #667eea',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 1rem'
          }}></div>
          <p>Loading bills...</p>
        </div>
      ) : getFilteredBills().length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#666' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📋</div>
          <h4 style={{ marginBottom: '0.5rem' }}>No bills found</h4>
          <p>
            {filter === 'all' 
              ? "You haven't created any bills yet. Click 'Create Bill' to get started!"
              : `No ${filter} bills at the moment.`
            }
          </p>
        </div>
      ) : (
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', 
          gap: '1.5rem' 
        }}>
          {getFilteredBills().map(bill => (
            <div 
              key={bill.billId}
              style={{
                background: 'white',
                borderRadius: '16px',
                padding: '1.5rem',
                boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                border: bill.status === 'Active' && bill.nextPayment <= new Date() ? '2px solid #f59e0b' : '1px solid #e5e7eb'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
                <div>
                  <h4 style={{ margin: '0 0 0.5rem 0', color: '#333' }}>{bill.description}</h4>
                  <p style={{ margin: 0, color: '#666', fontSize: '0.9rem' }}>
                    To: {bill.payee.slice(0, 6)}...{bill.payee.slice(-4)}
                  </p>
                </div>
                <div style={{
                  padding: '0.25rem 0.75rem',
                  borderRadius: '20px',
                  fontSize: '0.8rem',
                  fontWeight: '600',
                  background: bill.status === 'Active' ? '#dcfce7' : '#f3f4f6',
                  color: bill.status === 'Active' ? '#166534' : '#666'
                }}>
                  {bill.status}
                </div>
              </div>

              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: '1fr 1fr', 
                gap: '1rem', 
                marginBottom: '1.5rem',
                fontSize: '0.9rem'
              }}>
                <div>
                  <span style={{ color: '#666' }}>Amount:</span>
                  <div style={{ fontWeight: '600', color: '#667eea', fontSize: '1.1rem' }}>
                    ${parseFloat(bill.amount).toFixed(2)} USDC
                  </div>
                </div>
                <div>
                  <span style={{ color: '#666' }}>Frequency:</span>
                  <div style={{ fontWeight: '600' }}>{frequencies[bill.frequency] || 'Custom'}</div>
                </div>
                <div>
                  <span style={{ color: '#666' }}>Next Payment:</span>
                  <div style={{ 
                    fontWeight: '600',
                    color: bill.nextPayment <= new Date() ? '#dc2626' : '#333'
                  }}>
                    {formatNextPayment(bill.nextPayment)}
                  </div>
                </div>
                <div>
                  <span style={{ color: '#666' }}>Progress:</span>
                  <div style={{ fontWeight: '600' }}>
                    {bill.completedPayments}/{bill.totalPayments} payments
                  </div>
                </div>
              </div>

              <div style={{ 
                display: 'flex', 
                gap: '0.5rem',
                marginBottom: '1rem'
              }}>
                <div style={{ 
                  flex: 1, 
                  height: '6px', 
                  background: '#e5e7eb', 
                  borderRadius: '3px',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    height: '100%',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    width: `${(parseInt(bill.completedPayments) / parseInt(bill.totalPayments)) * 100}%`,
                    transition: 'width 0.3s ease'
                  }}></div>
                </div>
                <span style={{ fontSize: '0.8rem', color: '#666' }}>
                  {Math.round((parseInt(bill.completedPayments) / parseInt(bill.totalPayments)) * 100)}%
                </span>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {bill.status === 'Active' && (
                  <button
                    onClick={() => executeBillPayment(bill.billId)}
                    disabled={loading}
                    style={{
                      flex: 1,
                      padding: '0.75rem',
                      background: bill.nextPayment <= new Date() ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : '#f3f4f6',
                      color: bill.nextPayment <= new Date() ? 'white' : '#666',
                      border: 'none',
                      borderRadius: '8px',
                      fontWeight: '600',
                      cursor: loading ? 'not-allowed' : 'pointer',
                      opacity: loading ? 0.6 : 1
                    }}
                  >
                    {bill.nextPayment <= new Date() ? '💳 Pay Now' : '⏰ Not Due Yet'}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showCreateForm && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            borderRadius: '16px',
            width: '90%',
            maxWidth: '500px',
            maxHeight: '90vh',
            overflow: 'auto'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '1.5rem',
              borderBottom: '1px solid #e5e7eb'
            }}>
              <h3 style={{ margin: 0 }}>Create New Bill</h3>
              <button 
                onClick={() => setShowCreateForm(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '1.5rem',
                  cursor: 'pointer',
                  color: '#666'
                }}
              >
                ×
              </button>
            </div>

            <form onSubmit={createBill} style={{ padding: '1.5rem' }}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
                  Bill Description *
                </label>
                <input
                  type="text"
                  value={newBill.description}
                  onChange={(e) => setNewBill({...newBill, description: e.target.value})}
                  placeholder="e.g., Monthly Electricity Bill"
                  required
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '1rem'
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
                    Amount (USDC) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={newBill.amount}
                    onChange={(e) => setNewBill({...newBill, amount: e.target.value})}
                    placeholder="100.00"
                    required
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      fontSize: '1rem'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
                    Frequency
                  </label>
                  <select
                    value={newBill.frequency}
                    onChange={(e) => setNewBill({...newBill, frequency: e.target.value})}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      fontSize: '1rem'
                    }}
                  >
                    {Object.entries(frequencies).map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
                    Payee Address *
                  </label>
                  <input
                    type="text"
                    value={newBill.payee}
                    onChange={(e) => setNewBill({...newBill, payee: e.target.value})}
                    placeholder="0x..."
                    required
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      fontSize: '1rem'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
                    Total Payments
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={newBill.totalPayments}
                    onChange={(e) => setNewBill({...newBill, totalPayments: e.target.value})}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      fontSize: '1rem'
                    }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
                  Category
                </label>
                <select
                  value={newBill.category}
                  onChange={(e) => setNewBill({...newBill, category: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '1rem'
                  }}
                >
                  {Object.entries(categories).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', gap: '1rem' }}>
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  style={{
                    flex: 1,
                    padding: '0.75rem',
                    background: '#f3f4f6',
                    color: '#666',
                    border: 'none',
                    borderRadius: '8px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    flex: 1,
                    padding: '0.75rem',
                    background: loading ? '#9ca3af' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontWeight: '600',
                    cursor: loading ? 'not-allowed' : 'pointer'
                  }}
                >
                  {loading ? 'Creating...' : 'Create Bill'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
