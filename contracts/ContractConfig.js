export const CONTRACT_ADDRESSES = {
  BILL_PAYMENT: "0x...",
  NFT_REWARDS: "0x...",
  BILL_POOL: "0x...",
  MOCK_USDC: "0x..."
};

export const BILL_PAYMENT_ABI = [
  
  "function createBill(address payee, address token, uint256 amount, uint256 frequency, uint256 totalPayments, string memory description, bytes32 category) external returns (uint256)",
  "function executeBillPayment(uint256 billId) external",
  "function updateBillStatus(uint256 billId, uint8 status) external",
  
  
  "function confirmPayment(uint256 paymentId, bytes32 proofHash) external",
  "function refundExpiredPayment(uint256 paymentId) external",
  
  
  "function getBill(uint256 billId) external view returns (tuple(uint256 billId, address payer, address payee, address token, uint256 amount, uint256 frequency, uint256 nextPayment, uint256 totalPayments, uint256 completedPayments, uint8 status, string description, bytes32 category))",
  "function getPayment(uint256 paymentId) external view returns (tuple(uint256 paymentId, uint256 billId, address payer, address payee, address token, uint256 amount, uint256 timestamp, uint256 confirmationDeadline, uint8 status, bytes32 proofHash))",
  "function getUserBills(address user) external view returns (uint256[])",
  "function getUserPayments(address user) external view returns (uint256[])",
  "function getDueBills() external view returns (uint256[])",
  "function getEscrowBalance(address token, address user) external view returns (uint256)",
  "function getCurrentBillId() external view returns (uint256)",
  "function getCurrentPaymentId() external view returns (uint256)",
  
  
  "function setPlatformFee(uint256 fee) external",
  "function setFeeCollector(address feeCollector) external",
  "function withdrawFees(address token) external",
  
  
  "event BillCreated(uint256 indexed billId, address indexed payer, address indexed payee, uint256 amount)",
  "event PaymentExecuted(uint256 indexed paymentId, uint256 indexed billId, uint256 amount)",
  "event PaymentConfirmed(uint256 indexed paymentId, bytes32 proofHash)",
  "event PaymentRefunded(uint256 indexed paymentId, uint256 amount)",
  "event BillStatusUpdated(uint256 indexed billId, uint8 status)"
];

export const NFT_REWARDS_ABI = [
  "function updateUserStats(address user) external",
  "function checkPaymentStreak(address user) external returns (bool)",
  "function getUserNFTs(address user) external view returns (uint256[])",
  "function getRewardNFT(uint256 tokenId) external view returns (tuple(uint256 tokenId, address recipient, uint8 tier, uint256 mintedAt, uint256 paymentsCompleted, uint256 totalValue, string achievement))",
  "function getUserTierStatus(address user) external view returns (bool bronze, bool silver, bool gold, bool diamond, bool platinum)",
  "function getUserStats(address user) external view returns (uint256 paymentCount, uint256 totalValue, uint256 nftCount, uint8 highestTier)",
  "function balanceOf(address owner) external view returns (uint256)",
  "function tokenURI(uint256 tokenId) external view returns (string)",
  "event RewardMinted(address indexed recipient, uint256 indexed tokenId, uint8 tier, string achievement)",
  "event TierAchieved(address indexed user, uint8 tier)",
  "event PaymentStreakReward(address indexed user, uint256 streakLength)"
];

export const BILL_POOL_ABI = [
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
  "function getActivePoolsForUser(address user) external view returns (uint256[])",
  "event PoolCreated(uint256 indexed poolId, address indexed creator, uint256 totalAmount)",
  "event ParticipantJoined(uint256 indexed poolId, address indexed participant)",
  "event ContributionMade(uint256 indexed poolId, address indexed contributor, uint256 amount)",
  "event PoolCompleted(uint256 indexed poolId, uint256 totalCollected)",
  "event PoolCancelled(uint256 indexed poolId)",
  "event RefundIssued(uint256 indexed poolId, address indexed contributor, uint256 amount)"
];

export const MOCK_USDC_ABI = [
  "function balanceOf(address account) external view returns (uint256)",
  "function transfer(address to, uint256 amount) external returns (bool)",
  "function allowance(address owner, address spender) external view returns (uint256)",
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function mint(address to, uint256 amount) external",
  "function faucet() external",
  "function burn(uint256 amount) external",
  "function decimals() external view returns (uint8)"
];

export const SOMNIA_TESTNET_CONFIG = {
  chainId: '0xC467', 
  chainName: 'Somnia Testnet',
  rpcUrls: ['https://testnet-rpc.somnia.network'],
  nativeCurrency: {
    name: 'STT',
    symbol: 'STT',
    decimals: 18
  },
  blockExplorerUrls: ['https://testnet-explorer.somnia.network']
};