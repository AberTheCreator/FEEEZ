import React, { createContext, useContext, useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { SUPPORTED_NETWORKS, CHAIN_CONFIG } from '../constants/chainConfig';

const Web3Context = createContext();

export const useWeb3 = () => {
  const context = useContext(Web3Context);
  if (!context) {
    throw new Error('useWeb3 must be used within a Web3Provider');
  }
  return context;
};

export const Web3Provider = ({ children }) => {
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [account, setAccount] = useState(null);
  const [chainId, setChainId] = useState(null);
  const [balance, setBalance] = useState('0');
  const [network, setNetwork] = useState(null);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState(null);

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
      
      if (!SUPPORTED_NETWORKS[network.chainId]) {
        try {
          await switchToSomniaNetwork();
        } catch (switchError) {
          setError('Please switch to Somnia network to use FEEEZ');
          return false;
        }
      }

      setProvider(web3Provider);
      setSigner(web3Signer);
      setAccount(userAccount);
      setChainId(network.chainId);
      setNetwork(SUPPORTED_NETWORKS[network.chainId] || network);

      const userBalance = await web3Provider.getBalance(userAccount);
      setBalance(ethers.utils.formatEther(userBalance));

      return true;
    } catch (error) {
      console.error('Error connecting wallet:', error);
      setError('Failed to connect wallet');
      return false;
    } finally {
      setConnecting(false);
    }
  };

  const switchToSomniaNetwork = async () => {
    if (!window.ethereum) throw new Error('MetaMask not found');

    const somniaTestnet = CHAIN_CONFIG.SOMNIA_TESTNET;
    
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: somniaTestnet.chainId }],
      });
    } catch (switchError) {
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [somniaTestnet],
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
    setNetwork(null);
    setError(null);
  };

  const updateBalance = async () => {
    if (provider && account) {
      try {
        const userBalance = await provider.getBalance(account);
        setBalance(ethers.utils.formatEther(userBalance));
      } catch (error) {
        console.error('Error updating balance:', error);
      }
    }
  };

  useEffect(() => {
    checkIfWalletConnected();

    if (window.ethereum) {
      window.ethereum.on('accountsChanged', (accounts) => {
        if (accounts.length === 0) {
          disconnectWallet();
        } else {
          connectWallet();
        }
      });

      window.ethereum.on('chainChanged', (chainId) => {
        window.location.reload();
      });

      return () => {
        if (window.ethereum.removeListener) {
          window.ethereum.removeListener('accountsChanged', connectWallet);
          window.ethereum.removeListener('chainChanged', () => window.location.reload());
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
  }, [account, provider]);

  const value = {
    provider,
    signer,
    account,
    chainId,
    balance,
    network,
    connecting,
    error,
    connectWallet,
    disconnectWallet,
    switchToSomniaNetwork,
    updateBalance,
    isConnected: !!account,
    isSupportedNetwork: chainId ? !!SUPPORTED_NETWORKS[chainId] : false
  };

  return (
    <Web3Context.Provider value={value}>
      {children}
    </Web3Context.Provider>
  );
};