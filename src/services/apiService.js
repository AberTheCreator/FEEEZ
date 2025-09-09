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