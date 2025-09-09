import { useState, useEffect } from 'react';
import useContract from './useContract';
import { useWeb3 } from '../context/Web3Context';

const useBillPools = () => {
  const [pools, setPools] = useState([]);
  const [myPools, setMyPools] = useState([]);
  const [loading, setLoading] = useState(true);
  const { contract } = useContract('BillPool');
  const { account } = useWeb3();

  const fetchPools = async () => {
    if (!contract || !account) return;

    setLoading(true);
    try {
      const poolCount = await contract.poolCount();
      const allPools = [];
      const userPools = [];

      for (let i = 0; i < poolCount; i++) {
        const pool = await contract.pools(i);
        const members = await contract.getPoolMembers(i);

        const poolData = {
          id: i,
          name: pool.name,
          description: pool.description,
          targetAmount: parseFloat(pool.targetAmount) / 1e6,
          currentAmount: parseFloat(pool.currentAmount) / 1e6,
          creator: pool.creator,
          maxMembers: pool.maxMembers.toNumber(),
          dueDate: new Date(pool.dueDate.toNumber() * 1000),
          isActive: pool.isActive,
          isCompleted: pool.isCompleted,
          members: members,
          memberCount: members.length
        };

        allPools.push(poolData);

        if (members.includes(account)) {
          userPools.push(poolData);
        }
      }

      setPools(allPools);
      setMyPools(userPools);
    } catch (error) {
      console.error('Error fetching pools:', error);
    } finally {
      setLoading(false);
    }
  };

  const createPool = async (poolData) => {
    if (!contract) throw new Error('Contract not initialized');

    const targetAmountInWei = Math.floor(poolData.targetAmount * 1e6);
    const dueDateTimestamp = Math.floor(new Date(poolData.dueDate).getTime() / 1000);

    const tx = await contract.createPool(
      poolData.name,
      poolData.description,
      targetAmountInWei,
      poolData.maxMembers,
      dueDateTimestamp,
      poolData.recipient
    );

    await tx.wait();
    await fetchPools();
    return tx;
  };

  const joinPool = async (poolId, amount) => {
    if (!contract) throw new Error('Contract not initialized');

    const amountInWei = Math.floor(amount * 1e6);
    const tx = await contract.joinPool(poolId, amountInWei);
    await tx.wait();
    await fetchPools();
    return tx;
  };

  const executePayment = async (poolId) => {
    if (!contract) throw new Error('Contract not initialized');

    const tx = await contract.executePayment(poolId);
    await tx.wait();
    await fetchPools();
    return tx;
  };

  useEffect(() => {
    fetchPools();
  }, [contract, account]);

  return {
    pools,
    myPools,
    loading,
    createPool,
    joinPool,
    executePayment,
    refetch: fetchPools
  };
};

export default useBillPools;