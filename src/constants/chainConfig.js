export const SUPPORTED_NETWORKS = {
  31337: {
    chainId: '0x7A69',
    chainName: 'Hardhat Local',
    nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
    rpcUrls: ['http://127.0.0.1:8545'],
    blockExplorerUrls: []
    
  },
  128137: {
    chainId: '0x1F4A9', 
    chainName: 'Somnia Testnet',
    nativeCurrency: { name: 'STT', symbol: 'STT', decimals: 18 },
    rpcUrls: ['https://testnet-rpc.somnia.network'],
    blockExplorerUrls: ['https://testnet-explorer.somnia.network'] // Use the actual explorer
  },
  2710: {
    chainId: '0xA96',
    chainName: 'Somnia Mainnet', 
    nativeCurrency: { name: 'STT', symbol: 'STT', decimals: 18 },
    rpcUrls: ['https://rpc.somnia.network'],
    blockExplorerUrls: ['https://explorer.somnia.network']
  }
};