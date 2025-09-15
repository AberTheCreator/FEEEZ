import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { useWeb3 } from '../context/Web3Context';
import { useAI } from '../context/AIContext';
import './Dashboard.css';

const BILL_PAYMENT_ABI = [
  "function getUserBills(address user) external view returns (uint256[])",
  "function getUserPayments(address user) external view returns (uint256[])",
  "function getBill(uint256 billId) external view returns (tuple(uint256 billId, address payer, address payee, address token, uint256 amount, uint256 frequency, uint256 nextPayment, uint256 totalPayments, uint256 completedPayments, uint8 status, string description, bytes32 category))",
  "function getPayment(uint256 paymentId) external view returns (tuple(uint256 paymentId, uint256 billId, address payer, address payee, address token, uint256 amount, uint256 timestamp, uint256 confirmationDeadline, uint8 status, bytes32 proofHash))",
  "function executeBillPayment(uint256 billId) external"
];

const Dashboard = () => {
  const { provider, signer, account, contractAddresses, usdcBalance } = useWeb3();
  const { analyzeSpending, aiInsights, budgetAnalysis, predictions } = useAI();
  
  const [bills, setBills] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalBills: 0,
    dueBills: 0,
    monthlySpend: 0,
    nextPayment: null
  });

  useEffect(() => {
    if (provider && account && contractAddresses?.billPayment) {
      loadDashboardData();
    }
  }, [provider, account, contractAddresses]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      
      if (!contractAddresses.billPayment || contractAddresses.billPayment === "0x0000000000000000000000000000000000000000") {
        console.warn('Contract address not configured');
        setLoading(false);
        return;
      }

      const contract = new ethers.Contract(
        contractAddresses.billPayment, 
        BILL_PAYMENT_ABI, 
        provider
      );
      
      try {
        const userBillIds = await contract.getUserBills(account);
        const userPaymentIds = await contract.getUserPayments(account);
        
        const billPromises = userBillIds.map(async (id) => {
          try {
            return await contract.getBill(id);
          } catch (error) {
            console.error(`Error fetching bill ${id}:`, error);
            return null;
          }
        });
        
        const paymentPromises = userPaymentIds.map(async (id) => {
          try {
            return await contract.getPayment(id);
          } catch (error) {
            console.error(`Error fetching payment ${id}:`, error);
            return null;
          }
        });
        
        const [billResults, paymentResults] = await Promise.all([
          Promise.all(billPromises),
          Promise.all(paymentPromises)
        ]);

        const formattedBills = billResults
          .filter(bill => bill !== null)
          .map(bill => ({
            billId: bill.billId.toString(),
            description: bill.description,
            amount: ethers.utils.formatUnits(bill.amount, 6),
            frequency: bill.frequency.toString(),
            nextPayment: bill.nextPayment.toString(),
            status: ['Active', 'Paused', 'Cancelled', 'Completed'][bill.status],
            category: bill.category ? ethers.utils.parseBytes32String(bill.category) : 'other'
          }));

        const formattedPayments = paymentResults
          .filter(payment => payment !== null)
          .map(payment => ({
            paymentId: payment.paymentId.toString(),
            billId: payment.billId.toString(),
            amount: ethers.utils.formatUnits(payment.amount, 6),
            timestamp: payment.timestamp.toString(),
            status: ['Pending', 'Escrowed', 'Confirmed', 'Failed', 'Refunded'][payment.status]
          }));

        setBills(formattedBills);
        setPayments(formattedPayments);
        
        calculateStats(formattedBills, formattedPayments);
        analyzeSpending(formattedBills, formattedPayments);
        
      } catch (contractError) {
        console.error('Contract interaction error:', contractError);
        
        setBills([]);
        setPayments([]);
        setStats({
          totalBills: 0,
          dueBills: 0,
          monthlySpend: 0,
          nextPayment: null
        });
      }
        
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (billsData, paymentsData) => {
    const now = Math.floor(Date.now() / 1000);
    const activeBills = billsData.filter(bill => bill.status === 'Active');
    
    const dueBills = activeBills.filter(bill => parseInt(bill.nextPayment) <= now);
    
    const monthlySpend = activeBills.reduce((total, bill) => {
      if (parseInt(bill.frequency) <= 30 * 24 * 60 * 60) {
        return total + parseFloat(bill.amount);
      }
      return total;
    }, 0);

    const nextBill = activeBills
      .filter(bill => parseInt(bill.nextPayment) > now)
      .sort((a, b) => parseInt(a.nextPayment) - parseInt(b.nextPayment))[0];

    setStats({
      totalBills: activeBills.length,
      dueBills: dueBills.length,
      monthlySpend,
      nextPayment: nextBill ? {
        description: nextBill.description,
        amount: nextBill.amount,
        date: new Date(parseInt(nextBill.nextPayment) * 1000)
      } : null
    });
  };

  const executeBillPayment = async (billId) => {
    try {
      if (!contractAddresses.billPayment || contractAddresses.billPayment === "0x0000000000000000000000000000000000000000") {
        alert('Contract not configured. Please check deployment.');
        return;
      }

      const contract = new ethers.Contract(
        contractAddresses.billPayment, 
        BILL_PAYMENT_ABI, 
        signer
      );
      
      const tx = await contract.executeBillPayment(billId);
      console.log('Payment transaction sent:', tx.hash);
      await tx.wait();
      
      loadDashboardData();
    } catch (error) {
      console.error('Error executing payment:', error);
      alert('Failed to execute payment: ' + (error.reason || error.message));
    }
  };

  if (loading) {
    return (
      <div className="dashboard">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading your financial dashboard...</p>
        </div>
      </div>
    );
  }

  if (!contractAddresses.billPayment || contractAddresses.billPayment === "0x0000000000000000000000000000000000000000") {
    return (
      <div className="dashboard">
        <div className="setup-message" style={{ textAlign: 'center', padding: '3rem' }}>
          <h2>Welcome to FEEEZ! 🎉</h2>
          <p style={{ marginBottom: '2rem' }}>
            Your contracts need to be deployed. Please check your environment configuration.
          </p>
          <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '8px', fontSize: '0.9rem' }}>
            <strong>Next steps:</strong>
            <ol style={{ textAlign: 'left', marginTop: '1rem' }}>
              <li>Deploy contracts using: <code>npm run deploy</code></li>
              <li>Update your .env file with contract addresses</li>
              <li>Refresh this page</li>
            </ol>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div className="header-main">
          <h1 className="dashboard-title">Financial Overview</h1>
          <div className="balance-display">
            <span className="balance-amount">${parseFloat(usdcBalance || 0).toLocaleString()}</span>
            <span className="balance-label">Available Balance</span>
          </div>
        </div>
        
        <div className="quick-stats">
          <div className="stat-card">
            <div className="stat-number">{stats.totalBills}</div>
            <div className="stat-label">Active Bills</div>
          </div>
          
          <div className={`stat-card ${stats.dueBills > 0 ? 'urgent' : ''}`}>
            <div className="stat-number">{stats.dueBills}</div>
            <div className="stat-label">Due Now</div>
          </div>
          
          <div className="stat-card">
            <div className="stat-number">${stats.monthlySpend.toFixed(2)}</div>
            <div className="stat-label">Monthly Spend</div>
          </div>
        </div>
      </div>

      <div className="dashboard-content">
        <div className="left-panel">
          <div className="card due-bills-card">
            <div className="card-header">
              <h2>Bills Due</h2>
              <span className="due-count">{stats.dueBills}</span>
            </div>
            
            <div className="due-bills-list">
              {bills.filter(bill => {
                const now = Math.floor(Date.now() / 1000);
                return bill.status === 'Active' && parseInt(bill.nextPayment) <= now;
              }).map(bill => (
                <div key={bill.billId} className="due-bill-item">
                  <div className="bill-info">
                    <span className="bill-description">{bill.description}</span>
                    <span className="bill-amount">${bill.amount}</span>
                  </div>
                  <button 
                    className="pay-button"
                    onClick={() => executeBillPayment(bill.billId)}
                  >
                    Pay Now
                  </button>
                </div>
              ))}
              
              {stats.dueBills === 0 && (
                <div className="no-due-bills">
                  <span className="success-icon">✅</span>
                  <p>All bills are up to date!</p>
                </div>
              )}
            </div>
          </div>

          <div className="card upcoming-bills-card">
            <div className="card-header">
              <h2>Upcoming Bills</h2>
            </div>
            
            <div className="upcoming-bills-list">
              {predictions.slice(0, 5).map((prediction, index) => (
                <div key={index} className="upcoming-bill-item">
                  <div className="bill-timeline">
                    <span className="days-until">{prediction.daysUntil}d</span>
                  </div>
                  <div className="bill-details">
                    <span className="bill-name">{prediction.description}</span>
                    <span className="bill-amount">${prediction.amount}</span>
                  </div>
                  <div className={`priority-indicator ${prediction.priority}`}></div>
                </div>
              ))}
              
              {predictions.length === 0 && (
                <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
                  <p>No upcoming bills found.</p>
                  <p style={{ fontSize: '0.9rem', marginTop: '0.5rem' }}>
                    Create your first bill to get started!
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="right-panel">
          <div className="card ai-insights-card">
            <div className="card-header">
              <h2>AI Insights</h2>
              <span className="ai-icon">🤖</span>
            </div>
            
            <div className="insights-list">
              {aiInsights.map((insight, index) => (
                <div key={index} className={`insight-item ${insight.type}`}>
                  <span className="insight-icon">{insight.icon}</span>
                  <div className="insight-content">
                    <h4>{insight.title}</h4>
                    <p>{insight.message}</p>
                  </div>
                </div>
              ))}
              
              {aiInsights.length === 0 && (
                <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
                  <span style={{ fontSize: '2rem', display: 'block', marginBottom: '1rem' }}>🤖</span>
                  <p>AI insights will appear here once you start making payments!</p>
                </div>
              )}
            </div>
          </div>

          <div className="card spending-breakdown-card">
            <div className="card-header">
              <h2>Spending Breakdown</h2>
            </div>
            
            {budgetAnalysis && Object.keys(budgetAnalysis.categories).length > 0 ? (
              <div className="spending-chart">
                {Object.entries(budgetAnalysis.categories).map(([category, amount]) => {
                  const percentage = (amount / budgetAnalysis.totalMonthlySpend) * 100;
                  return (
                    <div key={category} className="category-item">
                      <div className="category-info">
                        <span className="category-name">{category}</span>
                        <span className="category-amount">${amount.toFixed(2)}</span>
                      </div>
                      <div className="category-bar">
                        <div 
                          className="category-fill"
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                      <span className="category-percentage">{percentage.toFixed(1)}%</span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
                <span style={{ fontSize: '2rem', display: 'block', marginBottom: '1rem' }}>📊</span>
                <p>Your spending breakdown will appear here once you have active bills!</p>
              </div>
            )}
          </div>

          <div className="card quick-actions-card">
            <div className="card-header">
              <h2>Quick Actions</h2>
            </div>
            
            <div className="actions-grid">
              <button className="action-button" onClick={() => window.alert('Feature coming soon!')}>
                <span className="action-icon">➕</span>
                <span className="action-text">Add Bill</span>
              </button>
              
              <button className="action-button" onClick={() => window.alert('Feature coming soon!')}>
                <span className="action-icon">🤝</span>
                <span className="action-text">Create Pool</span>
              </button>
              
              <button className="action-button" onClick={() => window.alert('Feature coming soon!')}>
                <span className="action-icon">💰</span>
                <span className="action-text">Get USDC</span>
              </button>
              
              <button className="action-button" onClick={() => window.alert('Feature coming soon!')}>
                <span className="action-icon">📊</span>
                <span className="action-text">View Reports</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
