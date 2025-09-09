
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

interface IBillPayment {
    function getUserPayments(address _user) external view returns (uint256[] memory);
    function getPayment(uint256 _paymentId) external view returns (
        uint256 paymentId,
        uint256 billId,
        address payer,
        address payee,
        address token,
        uint256 amount,
        uint256 timestamp,
        uint256 confirmationDeadline,
        uint8 status,
        bytes32 proofHash
    );
}

contract NFTRewards is ERC721, ERC721URIStorage, Ownable, ReentrancyGuard {
    using Counters for Counters.Counter;
    
    Counters.Counter private _tokenIds;
    
    IBillPayment public billPaymentContract;
    
    enum RewardTier { Bronze, Silver, Gold, Diamond, Platinum }
    
    struct RewardNFT {
        uint256 tokenId;
        address recipient;
        RewardTier tier;
        uint256 mintedAt;
        uint256 paymentsCompleted;
        uint256 totalValue;
        string achievement;
    }
    
    mapping(uint256 => RewardNFT) public rewardNFTs;
    mapping(address => uint256[]) public userNFTs;
    mapping(address => mapping(RewardTier => bool)) public userTierAchieved;
    mapping(address => uint256) public userPaymentCount;
    mapping(address => uint256) public userTotalValue;
    
    mapping(RewardTier => uint256) public tierRequirements;
    mapping(RewardTier => string) public tierURIs;
    
    uint256 public constant STREAK_REWARD_THRESHOLD = 5;
    uint256 public constant HIGH_VALUE_THRESHOLD = 1000 * 1e6;
    
    event RewardMinted(address indexed recipient, uint256 indexed tokenId, RewardTier tier, string achievement);
    event TierAchieved(address indexed user, RewardTier tier);
    event PaymentStreakReward(address indexed user, uint256 streakLength);
    
    constructor(address _billPaymentContract) ERC721("FEEEZ Loyalty Rewards", "FEEEZ") {
        billPaymentContract = IBillPayment(_billPaymentContract);
        
        tierRequirements[RewardTier.Bronze] = 3;
        tierRequirements[RewardTier.Silver] = 10;
        tierRequirements[RewardTier.Gold] = 25;
        tierRequirements[RewardTier.Diamond] = 50;
        tierRequirements[RewardTier.Platinum] = 100;
        
        tierURIs[RewardTier.Bronze] = "https://ipfs.io/ipfs/QmBronzeReward";
        tierURIs[RewardTier.Silver] = "https://ipfs.io/ipfs/QmSilverReward";
        tierURIs[RewardTier.Gold] = "https://ipfs.io/ipfs/QmGoldReward";
        tierURIs[RewardTier.Diamond] = "https://ipfs.io/ipfs/QmDiamondReward";
        tierURIs[RewardTier.Platinum] = "https://ipfs.io/ipfs/QmPlatinumReward";
    }
    
    function updateUserStats(address _user) public {
        uint256[] memory paymentIds = billPaymentContract.getUserPayments(_user);
        uint256 confirmedPayments = 0;
        uint256 totalValue = 0;
        
        for (uint256 i = 0; i < paymentIds.length; i++) {
            (,,,,,uint256 amount,,,uint8 status,) = billPaymentContract.getPayment(paymentIds[i]);
            if (status == 2) {
                confirmedPayments++;
                totalValue += amount;
            }
        }
        
        userPaymentCount[_user] = confirmedPayments;
        userTotalValue[_user] = totalValue;
        
        checkAndMintTierReward(_user, confirmedPayments, totalValue);
    }
    
    function checkAndMintTierReward(address _user, uint256 _paymentCount, uint256 _totalValue) internal {
        RewardTier highestEligibleTier = getHighestEligibleTier(_paymentCount);
        
        for (uint256 i = 0; i <= uint256(highestEligibleTier); i++) {
            RewardTier tier = RewardTier(i);
            if (!userTierAchieved[_user][tier] && _paymentCount >= tierRequirements[tier]) {
                mintTierReward(_user, tier, _paymentCount, _totalValue);
                userTierAchieved[_user][tier] = true;
                emit TierAchieved(_user, tier);
            }
        }
        
        if (_totalValue >= HIGH_VALUE_THRESHOLD && !userTierAchieved[_user][RewardTier.Diamond]) {
            mintSpecialReward(_user, "High Value Payer", _paymentCount, _totalValue);
        }
    }
    
    function getHighestEligibleTier(uint256 _paymentCount) internal view returns (RewardTier) {
        if (_paymentCount >= tierRequirements[RewardTier.Platinum]) return RewardTier.Platinum;
        if (_paymentCount >= tierRequirements[RewardTier.Diamond]) return RewardTier.Diamond;
        if (_paymentCount >= tierRequirements[RewardTier.Gold]) return RewardTier.Gold;
        if (_paymentCount >= tierRequirements[RewardTier.Silver]) return RewardTier.Silver;
        return RewardTier.Bronze;
    }
    
    function mintTierReward(
        address _recipient, 
        RewardTier _tier, 
        uint256 _paymentCount, 
        uint256 _totalValue
    ) internal {
        _tokenIds.increment();
        uint256 tokenId = _tokenIds.current();
        
        _safeMint(_recipient, tokenId);
        _setTokenURI(tokenId, tierURIs[_tier]);
        
        string memory achievement = getTierAchievementText(_tier);
        
        rewardNFTs[tokenId] = RewardNFT({
            tokenId: tokenId,
            recipient: _recipient,
            tier: _tier,
            mintedAt: block.timestamp,
            paymentsCompleted: _paymentCount,
            totalValue: _totalValue,
            achievement: achievement
        });
        
        userNFTs[_recipient].push(tokenId);
        
        emit RewardMinted(_recipient, tokenId, _tier, achievement);
    }
    
    function mintSpecialReward(
        address _recipient,
        string memory _achievementType,
        uint256 _paymentCount,
        uint256 _totalValue
    ) internal {
        _tokenIds.increment();
        uint256 tokenId = _tokenIds.current();
        
        _safeMint(_recipient, tokenId);
        _setTokenURI(tokenId, "https://ipfs.io/ipfs/QmSpecialReward");
        
        rewardNFTs[tokenId] = RewardNFT({
            tokenId: tokenId,
            recipient: _recipient,
            tier: RewardTier.Diamond,
            mintedAt: block.timestamp,
            paymentsCompleted: _paymentCount,
            totalValue: _totalValue,
            achievement: _achievementType
        });
        
        userNFTs[_recipient].push(tokenId);
        
        emit RewardMinted(_recipient, tokenId, RewardTier.Diamond, _achievementType);
    }
    
    function checkPaymentStreak(address _user) external returns (bool) {
        uint256[] memory paymentIds = billPaymentContract.getUserPayments(_user);
        if (paymentIds.length < STREAK_REWARD_THRESHOLD) return false;
        
        uint256 streakCount = 0;
        uint256 lastPaymentTime = 0;
        
        for (uint256 i = paymentIds.length; i > 0; i--) {
            (,,,,, uint256 amount, uint256 timestamp,,uint8 status,) = billPaymentContract.getPayment(paymentIds[i-1]);
            
            if (status == 2) {
                if (lastPaymentTime == 0 || (lastPaymentTime - timestamp) <= 32 days) {
                    streakCount++;
                    lastPaymentTime = timestamp;
                } else {
                    break;
                }
            }
        }
        
        if (streakCount >= STREAK_REWARD_THRESHOLD) {
            mintSpecialReward(_user, "Payment Streak Champion", streakCount, userTotalValue[_user]);
            emit PaymentStreakReward(_user, streakCount);
            return true;
        }
        
        return false;
    }
    
    function getTierAchievementText(RewardTier _tier) internal pure returns (string memory) {
        if (_tier == RewardTier.Bronze) return "First Steps - 3 Bills Paid";
        if (_tier == RewardTier.Silver) return "Getting Organized - 10 Bills Paid";
        if (_tier == RewardTier.Gold) return "Bill Master - 25 Bills Paid";
        if (_tier == RewardTier.Diamond) return "Payment Pro - 50 Bills Paid";
        if (_tier == RewardTier.Platinum) return "FEEEZ Legend - 100 Bills Paid";
        return "Achievement Unlocked";
    }
    
    function getUserNFTs(address _user) external view returns (uint256[] memory) {
        return userNFTs[_user];
    }
    
    function getRewardNFT(uint256 _tokenId) external view returns (RewardNFT memory) {
        return rewardNFTs[_tokenId];
    }
    
    function getUserTierStatus(address _user) external view returns (
        bool bronze,
        bool silver,
        bool gold,
        bool diamond,
        bool platinum
    ) {
        return (
            userTierAchieved[_user][RewardTier.Bronze],
            userTierAchieved[_user][RewardTier.Silver],
            userTierAchieved[_user][RewardTier.Gold],
            userTierAchieved[_user][RewardTier.Diamond],
            userTierAchieved[_user][RewardTier.Platinum]
        );
    }
    
    function getUserStats(address _user) external view returns (
        uint256 paymentCount,
        uint256 totalValue,
        uint256 nftCount,
        RewardTier highestTier
    ) {
        paymentCount = userPaymentCount[_user];
        totalValue = userTotalValue[_user];
        nftCount = userNFTs[_user].length;
        highestTier = getHighestEligibleTier(paymentCount);
    }
    
    function setTierURI(RewardTier _tier, string memory _uri) external onlyOwner {
        tierURIs[_tier] = _uri;
    }
    
    function setTierRequirement(RewardTier _tier, uint256 _requirement) external onlyOwner {
        tierRequirements[_tier] = _requirement;
    }
    
    function setBillPaymentContract(address _contract) external onlyOwner {
        billPaymentContract = IBillPayment(_contract);
    }
    
    function tokenURI(uint256 tokenId) public view override(ERC721, ERC721URIStorage) returns (string memory) {
        return super.tokenURI(tokenId);
    }
    
    function _burn(uint256 tokenId) internal override(ERC721, ERC721URIStorage) {
        super._burn(tokenId);
    }
    
    function supportsInterface(bytes4 interfaceId) public view override(ERC721, ERC721URIStorage) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}