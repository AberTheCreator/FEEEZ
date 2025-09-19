import { useState, useEffect } from 'react';
import useContract from './useContract.js';
import { useWeb3 } from '../../context/Web3Context.js';

const useNFTRewards = () => {
  const [nfts, setNfts] = useState([]);
  const [stats, setStats] = useState({
    totalNFTs: 0,
    totalPayments: 0,
    currentStreak: 0,
    totalSaved: 0
  });
  const [loading, setLoading] = useState(true);
  const { contract } = useContract('NFTRewards');
  const { account } = useWeb3();

  const fetchNFTs = async () => {
    if (!contract || !account) return;

    setLoading(true);
    try {
      const balance = await contract.balanceOf(account);
      const nftData = [];

      for (let i = 0; i < balance; i++) {
        const tokenId = await contract.tokenOfOwnerByIndex(account, i);
        const tokenURI = await contract.tokenURI(tokenId);
        const nftInfo = await contract.nftInfo(tokenId);

        nftData.push({
          tokenId: tokenId.toString(),
          tier: nftInfo.tier,
          mintDate: new Date(nftInfo.mintDate.toNumber() * 1000),
          paymentsCount: nftInfo.paymentsCount.toNumber(),
          metadata: JSON.parse(atob(tokenURI.split(',')[1]))
        });
      }

      setNfts(nftData);

      const userStats = await contract.userStats(account);
      setStats({
        totalNFTs: balance.toNumber(),
        totalPayments: userStats.totalPayments.toNumber(),
        currentStreak: userStats.currentStreak.toNumber(),
        totalSaved: parseFloat(userStats.totalSaved) / 1e6
      });
    } catch (error) {
      console.error('Error fetching NFTs:', error);
    } finally {
      setLoading(false);
    }
  };

  const claimReward = async () => {
    if (!contract) throw new Error('Contract not initialized');

    const tx = await contract.claimReward();
    await tx.wait();
    await fetchNFTs();
    return tx;
  };

  useEffect(() => {
    fetchNFTs();
  }, [contract, account]);

  return {
    nfts,
    stats,
    loading,
    claimReward,
    refetch: fetchNFTs
  };
};

export default useNFTRewards;