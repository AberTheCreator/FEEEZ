
pragma solidity ^0.8.19;

interface IBillPool {
    enum PoolStatus { Active, Completed, Cancelled }
    
    struct Pool {
        uint256 id;
        address creator;
        string description;
        uint256 targetAmount;
        uint256 currentAmount;
        uint256 deadline;
        uint256 minContribution;
        uint256 maxContribution;
        PoolStatus status;
        address[] contributors;
        uint256 createdAt;
    }
    
    struct Contribution {
        address contributor;
        uint256 amount;
        uint256 timestamp;
        bool refunded;
    }
    
    event PoolCreated(uint256 indexed poolId, address indexed creator, uint256 targetAmount, uint256 deadline);
    event ContributionMade(uint256 indexed poolId, address indexed contributor, uint256 amount);
    event PoolCompleted(uint256 indexed poolId, uint256 totalAmount);
    event PoolCancelled(uint256 indexed poolId, address indexed creator);
    event RefundIssued(uint256 indexed poolId, address indexed contributor, uint256 amount);
    
    function createPool(
        string calldata _description,
        uint256 _targetAmount,
        uint256 _deadline,
        uint256 _minContribution,
        uint256 _maxContribution
    ) external returns (uint256);
    
    function contributeToPool(uint256 _poolId, uint256 _amount) external;
    function completePool(uint256 _poolId, address _payee) external;
    function cancelPool(uint256 _poolId) external;
    function requestRefund(uint256 _poolId) external;
    function emergencyRefund(uint256 _poolId) external;
    
    function getPool(uint256 _poolId) external view returns (Pool memory);
    function getPoolContributions(uint256 _poolId) external view returns (Contribution[] memory);
    function getUserContributions(address _user) external view returns (uint256[] memory);
    function getActivePools() external view returns (uint256[] memory);
    function isPoolFunded(uint256 _poolId) external view returns (bool);
}