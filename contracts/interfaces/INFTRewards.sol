
pragma solidity ^0.8.19;

interface INFTRewards {
    enum RewardTier { Bronze, Silver, Gold, Platinum, Diamond }
    
    struct RewardNFT {
        uint256 tokenId;
        address recipient;
        RewardTier tier;
        uint256 paymentsCount;
        uint256 totalPaid;
        uint256 mintDate;
        string metadataURI;
        bool isActive;
    }
    
    event NFTMinted(uint256 indexed tokenId, address indexed recipient, RewardTier tier, uint256 paymentsCount);
    event TierUpgraded(uint256 indexed tokenId, RewardTier oldTier, RewardTier newTier);
    event RewardClaimed(address indexed user, uint256 indexed tokenId, RewardTier tier);
    
    function mintRewardNFT(address _recipient, uint256 _paymentsCount, uint256 _totalPaid) external returns (uint256);
    function upgradeNFTTier(uint256 _tokenId) external;
    function getRewardTier(uint256 _paymentsCount, uint256 _totalPaid) external pure returns (RewardTier);
    function getUserNFTs(address _user) external view returns (uint256[] memory);
    function getNFTDetails(uint256 _tokenId) external view returns (RewardNFT memory);
    function isEligibleForReward(address _user) external view returns (bool);
    function claimReward(address _user) external returns (uint256);
}