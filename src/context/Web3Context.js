import React, { createContext, useContext, useState, useEffect } from 'react';
import { ethers } from 'ethers';

const Web3Context = createContext();

export const useWeb3 = () => {
  const context = useContext(Web3Context);
  if (!context) {
    throw new Error('useWeb3 must be used within a Web3Provider');
  }
  return context;
};

const SOMNIA_TESTNET_CONFIG = {
  chainId: '0xC478', 
  chainName: 'Somnia Testnet (Shannon)',
  nativeCurrency: {
    name: 'STT',
    symbol: 'STT',
    decimals: 18
  },
  rpcUrls: ['https://dream-rpc.somnia.network'],
  blockExplorerUrls: ['https://shannon-explorer.somnia.network']
};

const getContractAddresses = () => {
  return {
    billPayment: process.env.REACT_APP_BILL_PAYMENT_ADDRESS || "0x0000000000000000000000000000000000000000",
    nftRewards: process.env.REACT_APP_NFT_REWARDS_ADDRESS || "0x0000000000000000000000000000000000000000",
    billPool: process.env.REACT_APP_BILL_POOL_ADDRESS || "0x0000000000000000000000000000000000000000",
    mockUSDC: process.env.REACT_APP_MOCK_USDC_ADDRESS || "0x0000000000000000000000000000000000000000"
  };
};

export const Web3Provider = ({ children }) => {
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [account, setAccount] = useState(null);
  const [chainId, setChainId] = useState(null);
  const [balance, setBalance] = useState('0');
  const [usdcBalance, setUsdcBalance] = useState('0');
  const [network, setNetwork] = useState(null);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState(null);
  const [contractAddresses, setContractAddresses] = useState(getContractAddresses());

  useEffect(() => {
    const addresses = getContractAddresses();
    setContractAddresses(addresses);
    console.log('Contract Addresses:', addresses);
  }, []);

  const checkIfWalletConnected = async () => {
    try {
      if (!window.ethereum) {
        setError('MetaMask is required to use this app');
        return;
      }

      const accounts = await window.ethereum.request({ method: 'eth_accounts' });
      if (accounts.length > 0) {
        await connectWallet();
      }
    } catch (error) {
      console.error('Error checking wallet connection:', error);
      setError('Failed to check wallet connection');
    }
  };

  const connectWallet = async () => {
    if (!window.ethereum) {
      setError('MetaMask is required');
      return false;
    }

    setConnecting(true);
    setError(null);

    try {
      await window.ethereum.request({ method: 'eth_requestAccounts' });
      
      const web3Provider = new ethers.providers.Web3Provider(window.ethereum);
      const web3Signer = web3Provider.getSigner();
      const userAccount = await web3Signer.getAddress();
      const network = await web3Provider.getNetwork();
      
      console.log('Connected to network:', network);
      console.log('User account:', userAccount);
      
      
      if (network.chainId !== 50312 && network.chainId !== 31337) {
        console.warn('Not on Somnia testnet, attempting to switch...');
        try {
          await switchToSomniaNetwork();
          
          window.location.reload();
          return false;
        } catch (switchError) {
          console.warn('Could not switch to Somnia, continuing on current network');
          setError('Please switch to Somnia testnet manually in MetaMask');
        }
      }

      setProvider(web3Provider);
      setSigner(web3Signer);
      setAccount(userAccount);
      setChainId(network.chainId);
      setNetwork({ 
        name: network.chainId === 50312 ? 'Somnia Testnet' : `Chain ${network.chainId}`, 
        chainId: network.chainId 
      });

      const userBalance = await web3Provider.getBalance(userAccount);
      setBalance(ethers.utils.formatEther(userBalance));

      await updateUsdcBalance(web3Provider, userAccount);

      return true;
    } catch (error) {
      console.error('Error connecting wallet:', error);
      setError(`Failed to connect wallet: ${error.message}`);
      return false;
    } finally {
      setConnecting(false);
    }
  };

  const updateUsdcBalance = async (web3Provider, userAccount) => {
    try {
      const addresses = contractAddresses;
      if (addresses.mockUSDC && addresses.mockUSDC !== "0x0000000000000000000000000000000000000000") {
        const usdcContract = new ethers.Contract(
          addresses.mockUSDC,
          [
            "function balanceOf(address account) external view returns (uint256)",
            "function decimals() external view returns (uint8)"
          ],
          web3Provider
        );
        
        const balance = await usdcContract.balanceOf(userAccount);
        const decimals = await usdcContract.decimals();
        setUsdcBalance(ethers.utils.formatUnits(balance, decimals));
        console.log('USDC Balance updated:', ethers.utils.formatUnits(balance, decimals));
      } else {
        console.warn('USDC contract address not available');
        setUsdcBalance('0');
      }
    } catch (error) {
      console.error('Error updating USDC balance:', error);
      setUsdcBalance('0');
    }
  };

  const switchToSomniaNetwork = async () => {
    if (!window.ethereum) throw new Error('MetaMask not found');
    
    try {
      
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: SOMNIA_TESTNET_CONFIG.chainId }],
      });
    } catch (switchError) {
      
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [SOMNIA_TESTNET_CONFIG],
          });
        } catch (addError) {
          throw new Error('Failed to add Somnia network');
        }
      } else {
        throw switchError;
      }
    }
  };

  const disconnectWallet = () => {
    setProvider(null);
    setSigner(null);
    setAccount(null);
    setChainId(null);
    setBalance('0');
    setUsdcBalance('0');
    setNetwork(null);
    setError(null);
  };

  const updateBalance = async () => {
    if (provider && account) {
      try {
        const userBalance = await provider.getBalance(account);
        setBalance(ethers.utils.formatEther(userBalance));
        await updateUsdcBalance(provider, account);
      } catch (error) {
        console.error('Error updating balance:', error);
      }
    }
  };

  useEffect(() => {
    checkIfWalletConnected();

    if (window.ethereum) {
      const handleAccountsChanged = (accounts) => {
        if (accounts.length === 0) {
          disconnectWallet();
        } else {
          connectWallet();
        }
      };

      const handleChainChanged = (chainId) => {
        console.log('Chain changed to:', chainId);
        window.location.reload();
      };

      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);

      return () => {
        if (window.ethereum.removeListener) {
          window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
          window.ethereum.removeListener('chainChanged', handleChainChanged);
        }
      };
    }
  }, []);

  useEffect(() => {
    if (account && provider) {
      updateBalance();
      const interval = setInterval(updateBalance, 30000);
      return () => clearInterval(interval);
    }
  }, [account, provider, contractAddresses]);

  const value = {
    provider,
    signer,
    account,
    chainId,
    balance,
    usdcBalance,
    network,
    connecting,
    error,
    contractAddresses,
    connectWallet,
    disconnectWallet,
    switchToSomniaNetwork,
    updateBalance,
    isConnected: !!account,
    isSupportedNetwork: chainId === 50312 || chainId === 31337
  };

  return (
    <Web3Context.Provider value={value}>
      {children}
    </Web3Context.Provider>
  );
};
