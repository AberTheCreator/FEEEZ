
pragma solidity ^0.8.19;

interface IBillPayment {
    enum BillStatus { Pending, Paid, Cancelled, Disputed }
    enum PaymentType { OneTime, Recurring }
    
    struct Bill {
        uint256 id;
        address payer;
        address payee;
        uint256 amount;
        uint256 dueDate;
        uint256 recurringInterval;
        PaymentType paymentType;
        BillStatus status;
        string description;
        bool autoPayEnabled;
        uint256 createdAt;
        uint256 lastPayment;
    }
    
    struct Payment {
        uint256 billId;
        uint256 amount;
        uint256 timestamp;
        address payer;
        address payee;
        string txHash;
    }
    
    event BillCreated(uint256 indexed billId, address indexed payer, address indexed payee, uint256 amount);
    event PaymentMade(uint256 indexed billId, address indexed payer, uint256 amount, uint256 timestamp);
    event EscrowReleased(uint256 indexed billId, address indexed payee, uint256 amount);
    event BillCancelled(uint256 indexed billId, address indexed payer);
    event AutoPayToggled(uint256 indexed billId, bool enabled);
    
    function createBill(
        address _payee,
        uint256 _amount,
        uint256 _dueDate,
        uint256 _recurringInterval,
        PaymentType _paymentType,
        string calldata _description,
        bool _autoPayEnabled
    ) external returns (uint256);
    
    function payBill(uint256 _billId) external;
    function releaseEscrow(uint256 _billId) external;
    function cancelBill(uint256 _billId) external;
    function toggleAutoPay(uint256 _billId) external;
    function executeAutoPay(uint256 _billId) external;
    function disputeBill(uint256 _billId, string calldata _reason) external;
    
    function getBill(uint256 _billId) external view returns (Bill memory);
    function getUserBills(address _user) external view returns (uint256[] memory);
    function getBillPayments(uint256 _billId) external view returns (Payment[] memory);
    function getOverdueBills(address _user) external view returns (uint256[] memory);
    function getUpcomingBills(address _user, uint256 _timeframe) external view returns (uint256[] memory);
}