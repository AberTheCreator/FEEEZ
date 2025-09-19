import { useState, useEffect, useCallback } from 'react';
import { useWeb3 } from '../../context/Web3Context.js';

const useBillPools = () => {
  const [pools, setPools] = useState([]);
  const [userPools, setUserPools] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { account, web3, contract } = useWeb3();

  const mockPools = [
    {
      id: 1,
      name: "Electricity Bill Pool",
      description: "Monthly electricity payments for apartment complex",
      creator: account || "0x1234...5678",
      targetAmount: 500,
      currentAmount: 320,
      participantCount: 8,
      maxParticipants: 10,
      deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      status: "active",
      billType: "electricity",
      members: [
        { address: account || "0x1234...5678", contribution: 40 },
        { address: "0x8765...4321", contribution: 40 },
        { address: "0x9999...1111", contribution: 40 },
        { address: "0x2222...3333", contribution: 40 },
        { address: "0x4444...5555", contribution: 40 },
        { address: "0x6666...7777", contribution: 40 },
        { address: "0x8888...9999", contribution: 40 },
        { address: "0x0000...1234", contribution: 40 },
      ]
    },
    {
      id: 2,
      name: "Internet Service Pool",
      description: "Shared internet costs for co-working space",
      creator: "0x9876...5432",
      targetAmount: 200,
      currentAmount: 150,
      participantCount: 5,
      maxParticipants: 8,
      deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      status: "active",
      billType: "internet",
      members: [
        { address: "0x9876...5432", contribution: 30 },
        { address: "0x1111...2222", contribution: 30 },
        { address: "0x3333...4444", contribution: 30 },
        { address: "0x5555...6666", contribution: 30 },
        { address: "0x7777...8888", contribution: 30 },
      ]
    },
    {
      id: 3,
      name: "Water Bill Collective",
      description: "Community water bill sharing",
      creator: account || "0x1234...5678",
      targetAmount: 300,
      currentAmount: 300,
      participantCount: 6,
      maxParticipants: 6,
      deadline: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      status: "completed",
      billType: "water",
      members: [
        { address: account || "0x1234...5678", contribution: 50 },
        { address: "0x1111...2222", contribution: 50 },
        { address: "0x3333...4444", contribution: 50 },
        { address: "0x5555...6666", contribution: 50 },
        { address: "0x7777...8888", contribution: 50 },
        { address: "0x9999...0000", contribution: 50 },
      ]
    }
  ];

  const loadPools = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      
      setPools(mockPools);
      
      const userPoolsFiltered = mockPools.filter(pool => 
        pool.creator === account || 
        pool.members.some(member => member.address === account)
      );
      setUserPools(userPoolsFiltered);
      
    } catch (err) {
      setError('Failed to load bill pools');
      console.error('Error loading pools:', err);
    } finally {
      setLoading(false);
    }
  }, [account]);

  const createPool = useCallback(async (poolData) => {
    setLoading(true);
    setError(null);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const newPool = {
        id: pools.length + 1,
        ...poolData,
        creator: account,
        currentAmount: 0,
        participantCount: 0,
        status: 'active',
        deadline: new Date(poolData.deadline),
        members: []
      };
      
      setPools(prev => [...prev, newPool]);
      setUserPools(prev => [...prev, newPool]);
      
      return newPool;
    } catch (err) {
      setError('Failed to create pool');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [pools, account]);

  const joinPool = useCallback(async (poolId, contributionAmount) => {
    setLoading(true);
    setError(null);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 2000)); 
      
      setPools(prev => prev.map(pool => {
        if (pool.id === poolId) {
          const newMember = { address: account, contribution: contributionAmount };
          return {
            ...pool,
            currentAmount: pool.currentAmount + contributionAmount,
            participantCount: pool.participantCount + 1,
            members: [...pool.members, newMember]
          };
        }
        return pool;
      }));
      
      
      const updatedPool = pools.find(p => p.id === poolId);
      if (updatedPool && !userPools.find(p => p.id === poolId)) {
        setUserPools(prev => [...prev, updatedPool]);
      }
      
    } catch (err) {
      setError('Failed to join pool');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [pools, userPools, account]);

  const executePayment = useCallback(async (poolId) => {
    setLoading(true);
    setError(null);
    
    try {
      
      await new Promise(resolve => setTimeout(resolve, 2000)); 
      
      setPools(prev => prev.map(pool => {
        if (pool.id === poolId) {
          return {
            ...pool,
            status: 'completed'
          };
        }
        return pool;
      }));
      
      setUserPools(prev => prev.map(pool => {
        if (pool.id === poolId) {
          return {
            ...pool,
            status: 'completed'
          };
        }
        return pool;
      }));
      
    } catch (err) {
      setError('Failed to execute payment');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getPoolById = useCallback((poolId) => {
    return pools.find(pool => pool.id === poolId);
  }, [pools]);

  const isUserInPool = useCallback((poolId) => {
    const pool = pools.find(p => p.id === poolId);
    if (!pool) return false;
    return pool.creator === account || pool.members.some(member => member.address === account);
  }, [pools, account]);

  const canUserJoinPool = useCallback((poolId) => {
    const pool = pools.find(p => p.id === poolId);
    if (!pool) return false;
    
    return (
      pool.status === 'active' &&
      pool.participantCount < pool.maxParticipants &&
      !isUserInPool(poolId) &&
      new Date() < pool.deadline
    );
  }, [pools, isUserInPool]);

  const canExecutePayment = useCallback((poolId) => {
    const pool = pools.find(p => p.id === poolId);
    if (!pool) return false;
    
    return (
      pool.creator === account &&
      pool.status === 'active' &&
      pool.currentAmount >= pool.targetAmount
    );
  }, [pools, account]);

  useEffect(() => {
    if (account) {
      loadPools();
    }
  }, [account, loadPools]);

  return {
    pools,
    userPools,
    loading,
    error,
    loadPools,
    createPool,
    joinPool,
    executePayment,
    getPoolById,
    isUserInPool,
    canUserJoinPool,
    canExecutePayment
  };
};

export default useBillPools;