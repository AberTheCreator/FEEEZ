
export const CONTRACT_ADDRESSES = {
  BillPayment: process.env.REACT_APP_BILL_PAYMENT_ADDRESS || "0x0000000000000000000000000000000000000000",
  NFTRewards: process.env.REACT_APP_NFT_REWARDS_ADDRESS || "0x0000000000000000000000000000000000000000", 
  BillPool: process.env.REACT_APP_BILL_POOL_ADDRESS || "0x0000000000000000000000000000000000000000",
  MockUSDC: process.env.REACT_APP_MOCK_USDC_ADDRESS || "0x0000000000000000000000000000000000000000"
};


export const NETWORKS = {
  31337: {
    name: 'Hardhat Local',
    rpcUrl: 'http://127.0.0.1:8545',
    chainId: 31337,
    isTestnet: true
  },
  50311: {
    name: 'Somnia Testnet',
    rpcUrl: 'https://dream-rpc.somnia.network',
    chainId: 50312,
    isTestnet: true,
    blockExplorer: 'https://testnet-explorer.somnia.network'
  }
};


export const getContractAddress = (contractName, chainId = 50311) => {
  return CONTRACT_ADDRESSES[contractName] || null;
};
