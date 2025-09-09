import { useState, useEffect } from 'react';
import { useWeb3 } from '../context/Web3Context';
import { contractService } from '../services/contractService';

const useContract = (contractName) => {
  const { provider, signer, account } = useWeb3();
  const [contract, setContract] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initContract = async () => {
      if (!provider || !account) {
        setContract(null);
        setLoading(false);
        return;
      }

      try {
        const contractInstance = await contractService.getContract(contractName, signer || provider);
        setContract(contractInstance);
      } catch (error) {
        console.error(`Error initializing ${contractName} contract:`, error);
        setContract(null);
      } finally {
        setLoading(false);
      }
    };

    initContract();
  }, [provider, signer, account, contractName]);

  return { contract, loading };
};

export default useContract;