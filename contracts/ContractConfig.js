export const CONTRACT_ADDRESSES = {
  BILL_PAYMENT: "0x...",
  NFT_REWARDS: "0x...",
  BILL_POOL: "0x...",
  MOCK_USDC: "0x..."
};

export const BILL_PAYMENT_ABI = [
  "function createBill(address payee, address token, uint256 amount, uint256 frequency, string memory description) external returns (uint256)",
  "function payBill(uint256 billId) external",
  "function getBill(uint256 billId) external view returns (tuple(uint256 id, address payer, address payee, address token, uint256 amount, uint256 frequency, uint256 nextPaymentDate, bool isActive, uint256 streak, uint256 totalPaid, string description, bytes32 proofHash))",
  "function getUserBills(address user) external view returns (uint256[])",
  "function getPaymentHistory(address user) external view returns (tuple(uint256 billId, uint256 amount, uint256 timestamp, bool confirmed, bytes32 proofHash, address token)[])",
  "function confirmPayment(uint256 paymentId, bytes32 proofHash) external",
  "function billCounter() external view returns (uint256)",
  "event BillCreated(uint256 indexed billId, address indexed payer, address indexed payee, uint256 amount)",
  "event PaymentMade(uint256 indexed billId, uint256 indexed paymentId, uint256 amount)",
  "event PaymentConfirmed(uint256 indexed paymentId, bytes32 proofHash)"
];

export const NFT_REWARDS_ABI = [
  "function mintReward(address user, uint256 streak) external",
  "function balanceOf(address owner) external view returns (uint256)",
  "function tokenOfOwnerByIndex(address owner, uint256 index) external view returns (uint256)",
  "function tokenURI(uint256 tokenId) external view returns (string)",
  "function rewards(uint256 tokenId) external view returns (tuple(uint256 streak, uint8 tier, uint256 points, uint256 timestamp))",
  "function getUserStats(address user) external view returns (tuple(uint256 totalNFTs, uint256 currentStreak, uint256 totalRewards))",
  "event RewardMinted(address indexed user, uint256 indexed tokenId, uint256 streak, uint8 tier)"
];

export const BILL_POOL_ABI = [
  "function createPool(string memory name, string memory description, uint256 targetAmount, uint256 maxMembers, uint256 endDate) external returns (uint256)",
  "function contributeToPool(uint256 poolId, uint256 amount) external",
  "function executePayment(uint256 poolId) external",
  "function pools(uint256 poolId) external view returns (tuple(string name, string description, address creator, uint256 totalAmount, uint256 targetAmount, uint256 maxMembers, uint256 endDate, bool isActive))",
  "function getPoolMembers(uint256 poolId) external view returns (address[])",
  "function getPoolContributions(uint256 poolId) external view returns (uint256[])",
  "function poolCounter() external view returns (uint256)",
  "event PoolCreated(uint256 indexed poolId, address indexed creator, uint256 targetAmount)",
  "event ContributionMade(uint256 indexed poolId, address indexed contributor, uint256 amount)",
  "event PaymentExecuted(uint256 indexed poolId, uint256 totalAmount)"
];

export const MOCK_USDC_ABI = [
  "function balanceOf(address account) external view returns (uint256)",
  "function transfer(address to, uint256 amount) external returns (bool)",
  "function allowance(address owner, address spender) external view returns (uint256)",
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function mint(address to, uint256 amount) external",
  "function decimals() external view returns (uint8)"
];

export const SOMNIA_TESTNET_CONFIG = {
  chainId: '0x1F49D',
  chainName: 'Somnia Testnet',
  rpcUrls: ['https://testnet-rpc.somnia.network'],
  nativeCurrency: {
    name: 'STT',
    symbol: 'STT',
    decimals: 18
  },
  blockExplorerUrls: ['https://testnet-explorer.somnia.network']
};