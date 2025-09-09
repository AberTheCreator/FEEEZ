
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract BillPayment is ReentrancyGuard, Ownable {
    uint256 private _billIdCounter;
    uint256 private _paymentIdCounter;
    
    enum BillStatus { Active, Paused, Cancelled, Completed }
    enum PaymentStatus { Pending, Escrowed, Confirmed, Failed, Refunded }
    
    struct Bill {
        uint256 billId;
        address payer;
        address payee;
        address token;
        uint256 amount;
        uint256 frequency;
        uint256 nextPayment;
        uint256 totalPayments;
        uint256 completedPayments;
        BillStatus status;
        string description;
        bytes32 category;
    }
    
    struct Payment {
        uint256 paymentId;
        uint256 billId;
        address payer;
        address payee;
        address token;
        uint256 amount;
        uint256 timestamp;
        uint256 confirmationDeadline;
        PaymentStatus status;
        bytes32 proofHash;
    }
    
    mapping(uint256 => Bill) public bills;
    mapping(uint256 => Payment) public payments;
    mapping(address => uint256[]) public userBills;
    mapping(address => uint256[]) public userPayments;
    mapping(address => mapping(address => uint256)) public escrowBalances;
    
    uint256 public constant CONFIRMATION_PERIOD = 7 days;
    uint256 public platformFee = 50; // 0.5% (50/10000)
    address public feeCollector;
    
    event BillCreated(uint256 indexed billId, address indexed payer, address indexed payee, uint256 amount);
    event PaymentExecuted(uint256 indexed paymentId, uint256 indexed billId, uint256 amount);
    event PaymentConfirmed(uint256 indexed paymentId, bytes32 proofHash);
    event PaymentRefunded(uint256 indexed paymentId, uint256 amount);
    event BillStatusUpdated(uint256 indexed billId, BillStatus status);
    event EscrowDeposit(address indexed token, address indexed user, uint256 amount);
    event EscrowWithdraw(address indexed token, address indexed user, uint256 amount);
    
    constructor(address _initialOwner, address _feeCollector) Ownable(_initialOwner) {
        require(_feeCollector != address(0), "Invalid fee collector");
        feeCollector = _feeCollector;
        _billIdCounter = 0;
        _paymentIdCounter = 0;
    }
    
    function createBill(
        address _payee,
        address _token,
        uint256 _amount,
        uint256 _frequency,
        uint256 _totalPayments,
        string memory _description,
        bytes32 _category
    ) external returns (uint256) {
        require(_payee != address(0), "Invalid payee");
        require(_payee != msg.sender, "Cannot pay yourself");
        require(_token != address(0), "Invalid token");
        require(_amount > 0, "Amount must be greater than 0");
        require(_frequency > 0, "Frequency must be greater than 0");
        require(_totalPayments > 0, "Total payments must be greater than 0");
        require(_totalPayments <= 1000, "Too many payments"); // Reasonable limit
        
        _billIdCounter++;
        uint256 billId = _billIdCounter;
        
        bills[billId] = Bill({
            billId: billId,
            payer: msg.sender,
            payee: _payee,
            token: _token,
            amount: _amount,
            frequency: _frequency,
            nextPayment: block.timestamp + _frequency,
            totalPayments: _totalPayments,
            completedPayments: 0,
            status: BillStatus.Active,
            description: _description,
            category: _category
        });
        
        userBills[msg.sender].push(billId);
        
        emit BillCreated(billId, msg.sender, _payee, _amount);
        return billId;
    }
    
    function executeBillPayment(uint256 _billId) external nonReentrant {
        Bill storage bill = bills[_billId];
        require(bill.payer == msg.sender, "Not authorized");
        require(bill.status == BillStatus.Active, "Bill not active");
        require(block.timestamp >= bill.nextPayment, "Payment not due");
        require(bill.completedPayments < bill.totalPayments, "Bill completed");
        
        IERC20 token = IERC20(bill.token);
        uint256 totalAmount = bill.amount;
        uint256 fee = (totalAmount * platformFee) / 10000;
        uint256 netAmount = totalAmount - fee;
        
        require(token.transferFrom(msg.sender, address(this), totalAmount), "Transfer failed");
        
        _paymentIdCounter++;
        uint256 paymentId = _paymentIdCounter;
        
        payments[paymentId] = Payment({
            paymentId: paymentId,
            billId: _billId,
            payer: msg.sender,
            payee: bill.payee,
            token: bill.token,
            amount: netAmount,
            timestamp: block.timestamp,
            confirmationDeadline: block.timestamp + CONFIRMATION_PERIOD,
            status: PaymentStatus.Escrowed,
            proofHash: bytes32(0)
        });
        
        escrowBalances[bill.token][bill.payee] += netAmount;
        escrowBalances[bill.token][feeCollector] += fee;
        
        userPayments[msg.sender].push(paymentId);
        
        bill.nextPayment += bill.frequency;
        bill.completedPayments++;
        
        if (bill.completedPayments >= bill.totalPayments) {
            bill.status = BillStatus.Completed;
            emit BillStatusUpdated(_billId, BillStatus.Completed);
        }
        
        emit PaymentExecuted(paymentId, _billId, netAmount);
    }
    
    function confirmPayment(uint256 _paymentId, bytes32 _proofHash) external {
        Payment storage payment = payments[_paymentId];
        require(payment.payee == msg.sender, "Not authorized");
        require(payment.status == PaymentStatus.Escrowed, "Payment not escrowed");
        require(block.timestamp <= payment.confirmationDeadline, "Confirmation period expired");
        
        payment.status = PaymentStatus.Confirmed;
        payment.proofHash = _proofHash;
        
        IERC20 token = IERC20(payment.token);
        uint256 amount = payment.amount;
        escrowBalances[payment.token][payment.payee] -= amount;
        
        require(token.transfer(payment.payee, amount), "Transfer failed");
        
        emit PaymentConfirmed(_paymentId, _proofHash);
    }
    
    function refundExpiredPayment(uint256 _paymentId) external nonReentrant {
        Payment storage payment = payments[_paymentId];
        require(payment.status == PaymentStatus.Escrowed, "Payment not escrowed");
        require(block.timestamp > payment.confirmationDeadline, "Confirmation period active");
        
        payment.status = PaymentStatus.Refunded;
        
        IERC20 token = IERC20(payment.token);
        uint256 amount = payment.amount;
        escrowBalances[payment.token][payment.payee] -= amount;
        
        require(token.transfer(payment.payer, amount), "Refund failed");
        
        emit PaymentRefunded(_paymentId, amount);
    }
    
    function updateBillStatus(uint256 _billId, BillStatus _status) external {
        Bill storage bill = bills[_billId];
        require(bill.payer == msg.sender, "Not authorized");
        require(bill.status != BillStatus.Completed, "Cannot modify completed bill");
        require(_status != BillStatus.Completed, "Use executeBillPayment to complete");
        
        bill.status = _status;
        emit BillStatusUpdated(_billId, _status);
    }
    
    function getBill(uint256 _billId) external view returns (Bill memory) {
        require(bills[_billId].payer != address(0), "Bill does not exist");
        return bills[_billId];
    }
    
    function getPayment(uint256 _paymentId) external view returns (Payment memory) {
        require(payments[_paymentId].payer != address(0), "Payment does not exist");
        return payments[_paymentId];
    }
    
    function getUserBills(address _user) external view returns (uint256[] memory) {
        return userBills[_user];
    }
    
    function getUserPayments(address _user) external view returns (uint256[] memory) {
        return userPayments[_user];
    }
    
    function getEscrowBalance(address _token, address _user) external view returns (uint256) {
        return escrowBalances[_token][_user];
    }
    
    function getDueBills() external view returns (uint256[] memory dueBills) {
        uint256[] memory myBills = userBills[msg.sender];
        uint256 dueCount = 0;
        
        // Count due bills
        for (uint256 i = 0; i < myBills.length; i++) {
            Bill memory bill = bills[myBills[i]];
            if (bill.status == BillStatus.Active && 
                block.timestamp >= bill.nextPayment && 
                bill.completedPayments < bill.totalPayments) {
                dueCount++;
            }
        }
        
        // Create array with due bills
        dueBills = new uint256[](dueCount);
        uint256 index = 0;
        
        for (uint256 i = 0; i < myBills.length; i++) {
            Bill memory bill = bills[myBills[i]];
            if (bill.status == BillStatus.Active && 
                block.timestamp >= bill.nextPayment && 
                bill.completedPayments < bill.totalPayments) {
                dueBills[index] = myBills[i];
                index++;
            }
        }
    }
    
    function getCurrentBillId() external view returns (uint256) {
        return _billIdCounter;
    }
    
    function getCurrentPaymentId() external view returns (uint256) {
        return _paymentIdCounter;
    }
    
    function setPlatformFee(uint256 _fee) external onlyOwner {
        require(_fee <= 1000, "Fee too high (max 10%)");
        platformFee = _fee;
    }
    
    function setFeeCollector(address _feeCollector) external onlyOwner {
        require(_feeCollector != address(0), "Invalid address");
        feeCollector = _feeCollector;
    }
    
    function withdrawFees(address _token) external onlyOwner {
        uint256 amount = escrowBalances[_token][feeCollector];
        require(amount > 0, "No fees to withdraw");
        
        escrowBalances[_token][feeCollector] = 0;
        IERC20(_token).transfer(feeCollector, amount);
    }
    
    function emergencyWithdraw(address _token, uint256 _amount) external onlyOwner {
        require(_amount > 0, "Invalid amount");
        IERC20(_token).transfer(owner(), _amount);
    }
}