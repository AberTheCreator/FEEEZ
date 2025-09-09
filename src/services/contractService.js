import { ethers } from 'ethers';
import { CONTRACT_ADDRESSES } from '../constants/contractAddresses';

const BILL_PAYMENT_ABI = [
  "function createBill(string memory name, uint256 amount, address recipient, uint256 frequency, uint256 dueDate) external",
  "function payBill(uint256 billId, uint256 amount) external",
  "function toggleBillStatus(uint256 billId) external",
  "function getUserBills(address user) external view returns (uint256[] memory)",
  "function bills(uint256) external view returns (string memory name, uint256 amount, address recipient, uint256 frequency, uint256 nextDueDate, bool isActive, uint256 paymentCount)",
  "function userBillCount(address) external view returns (uint256)"
];

const NFT_REWARDS_ABI = [
  "function balanceOf(address owner) external view returns (uint256)",
  "function tokenOfOwnerByIndex(address owner, uint256 index) external view returns (uint256)",
  "function tokenURI(uint256 tokenId) external view returns (string memory)",
  "function claimReward() external",
  "function nftInfo(uint256 tokenId) external view returns (uint256 tier, uint256 mintDate, uint256 paymentsCount)",
  "function userStats(address user) external view returns (uint256 totalPayments, uint256 currentStreak, uint256 totalSaved)"
];

const BILL_POOL_ABI = [
  "function createPool(string memory name, string memory description, uint256 targetAmount, uint256 maxMembers, uint256 dueDate, address recipient) external",
  "function joinPool(uint256 poolId, uint256 amount) external",
  "function executePayment(uint256 poolId) external",
  "function poolCount() external view returns (uint256)",
  "function pools(uint256) external view returns (string memory name, string memory description, uint256 targetAmount, uint256 currentAmount, address creator, uint256 maxMembers, uint256 dueDate, bool isActive, bool isCompleted)",
  "function getPoolMembers(uint256 poolId) external view returns (address[] memory)"
];

const MOCK_USDC_ABI = [
  "function balanceOf(address account) external view returns (uint256)",
  "function transfer(address to, uint256 amount) external returns (bool)",
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function allowance(address owner, address spender) external view returns (uint256)",
  "function mint(address to, uint256 amount) external"
];

export const contractService = {
  getContract: async (contractName, signerOrProvider) => {
    const address = CONTRACT_ADDRESSES[contractName];
    if (!address) {
      throw new Error(`Contract address not found for ${contractName}`);
    }

    let abi;
    switch (contractName) {
      case 'BillPayment':
        abi = BILL_PAYMENT_ABI;
        break;
      case 'NFTRewards':
        abi = NFT_REWARDS_ABI;
        break;
      case 'BillPool':
        abi = BILL_POOL_ABI;
        break;
      case 'MockUSDC':
        abi = MOCK_USDC_ABI;
        break;
      default:
        throw new Error(`ABI not found for contract ${contractName}`);
    }

    return new ethers.Contract(address, abi, signerOrProvider);
  },

  async approveToken(tokenContract, spenderAddress, amount) {
    const tx = await tokenContract.approve(spenderAddress, amount);
    return await tx.wait();
  },

  async getTokenBalance(tokenContract, userAddress) {
    const balance = await tokenContract.balanceOf(userAddress);
    return parseFloat(balance) / 1e6;
  }
};

export const aiService = {
  analyzeSpending: (bills, payments) => {
    const totalMonthlyBills = bills.reduce((sum, bill) => sum + bill.amount, 0);
    const averagePayment = payments.length > 0 
      ? payments.reduce((sum, payment) => sum + payment.amount, 0) / payments.length 
      : 0;
    
    const insights = [];
    
    if (totalMonthlyBills > 1000) {
      insights.push({
        type: 'warning',
        title: 'High Monthly Bills',
        message: `Your monthly bills total $${totalMonthlyBills.toFixed(2)}. Consider reviewing for potential savings.`,
        action: 'Review bills'
      });
    }
    
    if (bills.filter(b => b.category === 'subscriptions').length > 3) {
      insights.push({
        type: 'tip',
        title: 'Subscription Optimization',
        message: 'You have multiple subscriptions. Consider canceling unused ones.',
        action: 'Audit subscriptions'
      });
    }
    
    const overduePayments = payments.filter(p => new Date(p.dueDate) < new Date());
    if (overduePayments.length > 0) {
      insights.push({
        type: 'alert',
        title: 'Overdue Payments',
        message: `You have ${overduePayments.length} overdue payment(s).`,
        action: 'Pay now'
      });
    }
    
    return {
      totalMonthlyBills,
      averagePayment,
      insights,
      savingsOpportunity: totalMonthlyBills * 0.1
    };
  },

  predictBills: (bills) => {
    const predictions = bills.map(bill => {
      const nextDue = new Date(bill.nextDueDate);
      const daysTillDue = Math.ceil((nextDue - new Date()) / (1000 * 60 * 60 * 24));
      
      return {
        billId: bill.id,
        name: bill.name,
        amount: bill.amount,
        dueDate: nextDue,
        daysTillDue,
        urgency: daysTillDue <= 3 ? 'high' : daysTillDue <= 7 ? 'medium' : 'low'
      };
    });
    
    return predictions.sort((a, b) => a.daysTillDue - b.daysTillDue);
  },

  generateBudgetSuggestions: (totalIncome, totalBills) => {
    const suggestions = [];
    const billsPercentage = (totalBills / totalIncome) * 100;
    
    if (billsPercentage > 50) {
      suggestions.push({
        category: 'Bills',
        message: 'Your bills exceed 50% of income. Consider reducing expenses or increasing income.',
        priority: 'high'
      });
    }
    
    if (billsPercentage < 30) {
      suggestions.push({
        category: 'Savings',
        message: 'Great! Your bills are under 30% of income. Consider increasing savings.',
        priority: 'positive'
      });
    }
    
    suggestions.push({
      category: 'Emergency Fund',
      message: 'Build an emergency fund covering 3-6 months of bills.',
      priority: 'medium'
    });
    
    return suggestions;
  },

  getChatResponse: async (message, context) => {
    const responses = {
      'how much do i spend': `Based on your bills, you spend approximately $${context.totalMonthlyBills?.toFixed(2) || '0'} monthly on bills.`,
      'when is my next bill': context.nextBill ? `Your next bill "${context.nextBill.name}" is due on ${context.nextBill.dueDate.toDateString()}.` : 'No upcoming bills found.',
      'save money': 'Try consolidating subscriptions, switching to annual plans for discounts, or reviewing utility providers.',
      'nft rewards': `You have ${context.nftCount || 0} NFT rewards. Keep paying bills consistently to earn more!`,
      'bill pools': 'Bill pools help split costs with friends. Create one for shared expenses like utilities or subscriptions.'
    };
    
    const lowerMessage = message.toLowerCase();
    const matchedResponse = Object.keys(responses).find(key => lowerMessage.includes(key));
    
    return matchedResponse ? responses[matchedResponse] : "I'm here to help with your bill management. Ask me about your spending, upcoming bills, or how to save money!";
  }
};

export const apiService = {
  async fetchGasPrices() {
    try {
      const response = await fetch('https://api.somnia.network/gas-prices');
      return await response.json();
    } catch (error) {
      return { standard: 20, fast: 25, instant: 30 };
    }
  },

  async fetchTokenPrices() {
    try {
      const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=ethereum,usd-coin&vs_currencies=usd');
      return await response.json();
    } catch (error) {
      return { ethereum: { usd: 2000 }, 'usd-coin': { usd: 1 } };
    }
  },

  async validateAddress(address) {
    try {
      return ethers.utils.isAddress(address);
    } catch (error) {
      return false;
    }
  },

  async estimateGas(contract, method, params) {
    try {
      return await contract.estimateGas[method](...params);
    } catch (error) {
      console.error('Gas estimation failed:', error);
      return ethers.BigNumber.from('200000');
    }
  },

  async waitForTransaction(txHash, provider) {
    try {
      return await provider.waitForTransaction(txHash, 1);
    } catch (error) {
      console.error('Transaction wait failed:', error);
      throw error;
    }
  }
};