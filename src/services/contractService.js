import { ethers } from 'ethers';

const BILL_PAYMENT_ABI = [
  "function createBill(address payee, address token, uint256 amount, uint256 frequency, uint256 totalPayments, string memory description, bytes32 category) external returns (uint256)",
  "function executeBillPayment(uint256 billId) external",
  "function updateBillStatus(uint256 billId, uint8 status) external",
  "function getBill(uint256 billId) external view returns (tuple(uint256 billId, address payer, address payee, address token, uint256 amount, uint256 frequency, uint256 nextPayment, uint256 totalPayments, uint256 completedPayments, uint8 status, string description, bytes32 category))",
  "function getPayment(uint256 paymentId) external view returns (tuple(uint256 paymentId, uint256 billId, address payer, address payee, address token, uint256 amount, uint256 timestamp, uint256 confirmationDeadline, uint8 status, bytes32 proofHash))",
  "function getUserBills(address user) external view returns (uint256[])",
  "function getUserPayments(address user) external view returns (uint256[])",
  "function getDueBills() external view returns (uint256[])",
  "function getEscrowBalance(address token, address user) external view returns (uint256)",
  "function confirmPayment(uint256 paymentId, bytes32 proofHash) external",
  "function refundExpiredPayment(uint256 paymentId) external"
];

const NFT_REWARDS_ABI = [
  "function balanceOf(address owner) external view returns (uint256)",
  "function tokenOfOwnerByIndex(address owner, uint256 index) external view returns (uint256)",
  "function tokenURI(uint256 tokenId) external view returns (string memory)",
  "function getUserNFTs(address user) external view returns (uint256[])",
  "function getRewardNFT(uint256 tokenId) external view returns (tuple(uint256 tokenId, address recipient, uint8 tier, uint256 mintedAt, uint256 paymentsCompleted, uint256 totalValue, string achievement))",
  "function getUserStats(address user) external view returns (uint256 paymentCount, uint256 totalValue, uint256 nftCount, uint8 highestTier)",
  "function updateUserStats(address user) external",
  "function checkPaymentStreak(address user) external returns (bool)"
];

const BILL_POOL_ABI = [
  "function createPool(address payee, address token, uint256 totalAmount, uint256 maxParticipants, uint256 deadline, uint8 splitType, string memory description, bytes32 category, bool allowPublicJoin) external returns (uint256)",
  "function joinPool(uint256 poolId) external",
  "function inviteToPool(uint256 poolId, address participant) external",
  "function contribute(uint256 poolId) external",
  "function cancelPool(uint256 poolId) external",
  "function claimRefund(uint256 poolId) external",
  "function calculateContribution(uint256 poolId, address contributor) external view returns (uint256)",
  "function getPool(uint256 poolId) external view returns (tuple(uint256 poolId, address creator, address payee, address token, uint256 totalAmount, uint256 collectedAmount, uint256 maxParticipants, uint256 deadline, uint8 status, uint8 splitType, string description, bytes32 category, bool allowPublicJoin))",
  "function getPoolParticipants(uint256 poolId) external view returns (address[])",
  "function getUserContribution(uint256 poolId, address user) external view returns (tuple(address contributor, uint256 amount, uint256 timestamp, bool claimed))",
  "function getUserPools(address user) external view returns (uint256[])",
  "function getActivePoolsForUser(address user) external view returns (uint256[])"
];

const MOCK_USDC_ABI = [
  "function balanceOf(address account) external view returns (uint256)",
  "function transfer(address to, uint256 amount) external returns (bool)",
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function allowance(address owner, address spender) external view returns (uint256)",
  "function mint(address to, uint256 amount) external",
  "function faucet() external",
  "function burn(uint256 amount) external",
  "function decimals() external view returns (uint8)"
];

export const contractService = {
  getContract: (contractName, signerOrProvider, contractAddresses) => {
    const address = contractAddresses?.[contractName];
    if (!address || address === "0x0000000000000000000000000000000000000000") {
      throw new Error(`Contract address not found for ${contractName}`);
    }

    let abi;
    switch (contractName) {
      case 'billPayment':
        abi = BILL_PAYMENT_ABI;
        break;
      case 'nftRewards':
        abi = NFT_REWARDS_ABI;
        break;
      case 'billPool':
        abi = BILL_POOL_ABI;
        break;
      case 'mockUSDC':
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
    const decimals = await tokenContract.decimals();
    return parseFloat(ethers.utils.formatUnits(balance, decimals));
  },

  async checkAllowance(tokenContract, owner, spender) {
    return await tokenContract.allowance(owner, spender);
  },

  async estimateGas(contract, method, params = []) {
    try {
      return await contract.estimateGas[method](...params);
    } catch (error) {
      console.error('Gas estimation failed:', error);
      return ethers.BigNumber.from('200000'); // Fallback
    }
  },

  async waitForTransaction(txHash, provider, confirmations = 1) {
    try {
      return await provider.waitForTransaction(txHash, confirmations);
    } catch (error) {
      console.error('Transaction wait failed:', error);
      throw error;
    }
  }
};
