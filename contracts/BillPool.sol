pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract BillPool is ReentrancyGuard, Ownable {
    using Counters for Counters.Counter;
    
    Counters.Counter private _poolIds;
    
    enum PoolStatus { Active, Collecting, Completed, Cancelled }
    enum SplitType { Equal, Custom, Percentage }
    
    struct Pool {
        uint256 poolId;
        address creator;
        address payee;
        address token;
        uint256 totalAmount;
        uint256 collectedAmount;
        uint256 maxParticipants;
        uint256 deadline;
        PoolStatus status;
        SplitType splitType;
        string description;
        bytes32 category;
        bool allowPublicJoin;
    }
    
    struct Contribution {
        address contributor;
        uint256 amount;
        uint256 timestamp;
        bool claimed;
    }
    
    struct CustomSplit {
        address participant;
        uint256 amount;
    }
    
    mapping(uint256 => Pool) public pools;
    mapping(uint256 => address[]) public poolParticipants;
    mapping(uint256 => mapping(address => Contribution)) public contributions;
    mapping(uint256 => mapping(address => bool)) public isParticipant;
    mapping(uint256 => CustomSplit[]) public customSplits;
    mapping(address => uint256[]) public userPools;
    
    uint256 public platformFee = 25;
    address public feeCollector;
    
    event PoolCreated(uint256 indexed poolId, address indexed creator, uint256 totalAmount);
    event ParticipantJoined(uint256 indexed poolId, address indexed participant);
    event ContributionMade(uint256 indexed poolId, address indexed contributor, uint256 amount);
    event PoolCompleted(uint256 indexed poolId, uint256 totalCollected);
    event PoolCancelled(uint256 indexed poolId);
    event RefundIssued(uint256 indexed poolId, address indexed contributor, uint256 amount);
    
    constructor(address _feeCollector) {
        feeCollector = _feeCollector;
    }
    
    function createPool(
        address _payee,
        address _token,
        uint256 _totalAmount,
        uint256 _maxParticipants,
        uint256 _deadline,
        SplitType _splitType,
        string memory _description,
        bytes32 _category,
        bool _allowPublicJoin
    ) external returns (uint256) {
        require(_payee != address(0), "Invalid payee");
        require(_token != address(0), "Invalid token");
        require(_totalAmount > 0, "Amount must be greater than 0");
        require(_maxParticipants > 1, "Need at least 2 participants");
        require(_deadline > block.timestamp, "Deadline must be in future");
        
        _poolIds.increment();
        uint256 poolId = _poolIds.current();
        
        pools[poolId] = Pool({
            poolId: poolId,
            creator: msg.sender,
            payee: _payee,
            token: _token,
            totalAmount: _totalAmount,
            collectedAmount: 0,
            maxParticipants: _maxParticipants,
            deadline: _deadline,
            status: PoolStatus.Active,
            splitType: _splitType,
            description: _description,
            category: _category,
            allowPublicJoin: _allowPublicJoin
        });
        
        poolParticipants[poolId].push(msg.sender);
        isParticipant[poolId][msg.sender] = true;
        userPools[msg.sender].push(poolId);
        
        emit PoolCreated(poolId, msg.sender, _totalAmount);
        return poolId;
    }
    
    function joinPool(uint256 _poolId) external {
        Pool storage pool = pools[_poolId];
        require(pool.status == PoolStatus.Active, "Pool not active");
        require(block.timestamp < pool.deadline, "Pool deadline passed");
        require(!isParticipant[_poolId][msg.sender], "Already a participant");
        require(poolParticipants[_poolId].length < pool.maxParticipants, "Pool is full");
        require(pool.allowPublicJoin || pool.creator == msg.sender, "Pool is private");
        
        poolParticipants[_poolId].push(msg.sender);
        isParticipant[_poolId][msg.sender] = true;
        userPools[msg.sender].push(_poolId);
        
        emit ParticipantJoined(_poolId, msg.sender);
    }
    
    function inviteToPool(uint256 _poolId, address _participant) external {
        Pool storage pool = pools[_poolId];
        require(pool.creator == msg.sender, "Only creator can invite");
        require(pool.status == PoolStatus.Active, "Pool not active");
        require(!isParticipant[_poolId][_participant], "Already a participant");
        require(poolParticipants[_poolId].length < pool.maxParticipants, "Pool is full");
        
        poolParticipants[_poolId].push(_participant);
        isParticipant[_poolId][_participant] = true;
        userPools[_participant].push(_poolId);
        
        emit ParticipantJoined(_poolId, _participant);
    }
    
    function setCustomSplit(uint256 _poolId, CustomSplit[] memory _splits) external {
        Pool storage pool = pools[_poolId];
        require(pool.creator == msg.sender, "Only creator can set splits");
        require(pool.splitType == SplitType.Custom, "Pool is not custom split type");
        require(pool.status == PoolStatus.Active, "Pool not active");
        
        delete customSplits[_poolId];
        
        uint256 totalSplit = 0;
        for (uint256 i = 0; i < _splits.length; i++) {
            require(isParticipant[_poolId][_splits[i].participant], "Invalid participant");
            customSplits[_poolId].push(_splits[i]);
            totalSplit += _splits[i].amount;
        }
        
        require(totalSplit == pool.totalAmount, "Split amounts don't match total");
    }
    
    function contribute(uint256 _poolId) external nonReentrant {
        Pool storage pool = pools[_poolId];
        require(pool.status == PoolStatus.Active, "Pool not active");
        require(block.timestamp < pool.deadline, "Pool deadline passed");
        require(isParticipant[_poolId][msg.sender], "Not a participant");
        require(contributions[_poolId][msg.sender].amount == 0, "Already contributed");
        
        uint256 contributionAmount = calculateContribution(_poolId, msg.sender);
        require(contributionAmount > 0, "Invalid contribution amount");
        
        IERC20 token = IERC20(pool.token);
        require(token.transferFrom(msg.sender, address(this), contributionAmount), "Transfer failed");
        
        contributions[_poolId][msg.sender] = Contribution({
            contributor: msg.sender,
            amount: contributionAmount,
            timestamp: block.timestamp,
            claimed: false
        });
        
        pool.collectedAmount += contributionAmount;
        
        emit ContributionMade(_poolId, msg.sender, contributionAmount);
        
        if (pool.collectedAmount >= pool.totalAmount) {
            completePool(_poolId);
        }
    }
    
    function calculateContribution(uint256 _poolId, address _contributor) public view returns (uint256) {
        Pool memory pool = pools[_poolId];
        
        if (pool.splitType == SplitType.Equal) {
            return pool.totalAmount / poolParticipants[_poolId].length;
        } else if (pool.splitType == SplitType.Custom) {
            CustomSplit[] memory splits = customSplits[_poolId];
            for (uint256 i = 0; i < splits.length; i++) {
                if (splits[i].participant == _contributor) {
                    return splits[i].amount;
                }
            }
        }
        
        return 0;
    }
    
    function completePool(uint256 _poolId) internal {
        Pool storage pool = pools[_poolId];
        pool.status = PoolStatus.Completed;
        
        uint256 fee = (pool.collectedAmount * platformFee) / 10000;
        uint256 netAmount = pool.collectedAmount - fee;
        
        IERC20 token = IERC20(pool.token);
        require(token.transfer(pool.payee, netAmount), "Payment to payee failed");
        require(token.transfer(feeCollector, fee), "Fee transfer failed");
        
        emit PoolCompleted(_poolId, pool.collectedAmount);
    }
    
    function cancelPool(uint256 _poolId) external {
        Pool storage pool = pools[_poolId];
        require(pool.creator == msg.sender, "Only creator can cancel");
        require(pool.status == PoolStatus.Active, "Pool not active");
        
        pool.status = PoolStatus.Cancelled;
        
        address[] memory participants = poolParticipants[_poolId];
        IERC20 token = IERC20(pool.token);
        
        for (uint256 i = 0; i < participants.length; i++) {
            Contribution memory contribution = contributions[_poolId][participants[i]];
            if (contribution.amount > 0) {
                require(token.transfer(contribution.contributor, contribution.amount), "Refund failed");
                emit RefundIssued(_poolId, contribution.contributor, contribution.amount);
            }
        }
        
        emit PoolCancelled(_poolId);
    }
    
    function claimRefund(uint256 _poolId) external nonReentrant {
        Pool memory pool = pools[_poolId];
        require(pool.status == PoolStatus.Cancelled || 
                (pool.status == PoolStatus.Active && block.timestamp > pool.deadline), 
                "Refund not available");
        
        Contribution storage contribution = contributions[_poolId][msg.sender];
        require(contribution.amount > 0, "No contribution to refund");
        require(!contribution.claimed, "Already claimed");
        
        contribution.claimed = true;
        
        IERC20 token = IERC20(pool.token);
        require(token.transfer(msg.sender, contribution.amount), "Refund failed");
        
        emit RefundIssued(_poolId, msg.sender, contribution.amount);
    }
    
    function getPool(uint256 _poolId) external view returns (Pool memory) {
        return pools[_poolId];
    }
    
    function getPoolParticipants(uint256 _poolId) external view returns (address[] memory) {
        return poolParticipants[_poolId];
    }
    
    function getUserContribution(uint256 _poolId, address _user) external view returns (Contribution memory) {
        return contributions[_poolId][_user];
    }
    
    function getUserPools(address _user) external view returns (uint256[] memory) {
        return userPools[_user];
    }
    
    function getCustomSplits(uint256 _poolId) external view returns (CustomSplit[] memory) {
        return customSplits[_poolId];
    }
    
    function getActivePoolsForUser(address _user) external view returns (uint256[] memory activePools) {
        uint256[] memory allPools = userPools[_user];
        uint256 activeCount = 0;
        
        for (uint256 i = 0; i < allPools.length; i++) {
            if (pools[allPools[i]].status == PoolStatus.Active) {
                activeCount++;
            }
        }
        
        activePools = new uint256[](activeCount);
        uint256 index = 0;
        
        for (uint256 i = 0; i < allPools.length; i++) {
            if (pools[allPools[i]].status == PoolStatus.Active) {
                activePools[index] = allPools[i];
                index++;
            }
        }
    }
    
    function setPlatformFee(uint256 _fee) external onlyOwner {
        require(_fee <= 1000, "Fee too high");
        platformFee = _fee;
    }
    
    function setFeeCollector(address _feeCollector) external onlyOwner {
        require(_feeCollector != address(0), "Invalid address");
        feeCollector = _feeCollector;
    }
}
