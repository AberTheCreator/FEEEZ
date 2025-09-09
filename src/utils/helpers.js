import { ethers } from 'ethers';

export const formatAddress = (address) => {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

export const formatAmount = (amount, decimals = 18) => {
  try {
    return ethers.utils.formatUnits(amount, decimals);
  } catch (error) {
    return '0';
  }
};

export const parseAmount = (amount, decimals = 18) => {
  try {
    return ethers.utils.parseUnits(amount.toString(), decimals);
  } catch (error) {
    return ethers.BigNumber.from(0);
  }
};

export const formatDate = (timestamp) => {
  if (!timestamp) return '';
  const date = new Date(timestamp * 1000);
  return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
};

export const getTimeUntilDue = (dueDate) => {
  const now = new Date();
  const due = new Date(dueDate * 1000);
  const diffTime = due - now;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays < 0) return 'Overdue';
  if (diffDays === 0) return 'Due today';
  if (diffDays === 1) return 'Due tomorrow';
  return `Due in ${diffDays} days`;
};

export const getFrequencyText = (frequency) => {
  const frequencies = {
    0: 'One-time',
    86400: 'Daily',
    604800: 'Weekly',
    2629746: 'Monthly',
    31556952: 'Yearly'
  };
  return frequencies[frequency] || 'Custom';
};

export const calculateNextPayment = (lastPayment, frequency) => {
  return lastPayment + frequency;
};

export const validateAmount = (amount) => {
  const num = parseFloat(amount);
  return !isNaN(num) && num > 0;
};

export const validateAddress = (address) => {
  try {
    return ethers.utils.isAddress(address);
  } catch (error) {
    return false;
  }
};

export const generateProofHash = (billId, amount, timestamp) => {
  return ethers.utils.keccak256(
    ethers.utils.defaultAbiCoder.encode(
      ['uint256', 'uint256', 'uint256'],
      [billId, amount, timestamp]
    )
  );
};

export const shortenText = (text, maxLength = 50) => {
  if (!text) return '';
  return text.length > maxLength ? text.slice(0, maxLength) + '...' : text;
};

export const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    return false;
  }
};

export const getNetworkConfig = (chainId) => {
  const networks = {
    31337: { name: 'Hardhat', isTestnet: true },
    128137: { name: 'Somnia Testnet', isTestnet: true },
    2710: { name: 'Somnia Mainnet', isTestnet: false }
  };
  return networks[chainId] || { name: 'Unknown', isTestnet: true };
};

export const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export const retry = async (fn, maxAttempts = 3, delayMs = 1000) => {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxAttempts - 1) throw error;
      await delay(delayMs * (i + 1));
    }
  }
};

export const debounce = (func, delay) => {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(null, args), delay);
  };
};

export const getErrorMessage = (error) => {
  if (error?.reason) return error.reason;
  if (error?.message) {
    if (error.message.includes('user rejected')) {
      return 'Transaction was rejected by user';
    }
    if (error.message.includes('insufficient funds')) {
      return 'Insufficient funds for transaction';
    }
    return error.message;
  }
  return 'An unknown error occurred';
};