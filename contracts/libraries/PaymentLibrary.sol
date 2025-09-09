
pragma solidity ^0.8.19;

library PaymentLibrary {
    uint256 public constant BASIS_POINTS = 10000;
    uint256 public constant MAX_FEE = 500; // 5%
    uint256 public constant MIN_PAYMENT = 1e6; // 1 USDC (6 decimals)
    uint256 public constant MAX_PAYMENT = 1e12; // 1M USDC
    
    struct FeeStructure {
        uint256 platformFee;
        uint256 processingFee;
        uint256 escrowFee;
    }
    
    error InvalidAmount();
    error InvalidFee();
    error InvalidTimeframe();
    error PaymentTooSmall();
    error PaymentTooLarge();
    
    function calculateFees(uint256 _amount, FeeStructure memory _fees) 
        internal 
        pure 
        returns (uint256 totalFees, uint256 netAmount) 
    {
        if (_amount < MIN_PAYMENT) revert PaymentTooSmall();
        if (_amount > MAX_PAYMENT) revert PaymentTooLarge();
        
        uint256 platformFee = (_amount * _fees.platformFee) / BASIS_POINTS;
        uint256 processingFee = (_amount * _fees.processingFee) / BASIS_POINTS;
        uint256 escrowFee = (_amount * _fees.escrowFee) / BASIS_POINTS;
        
        totalFees = platformFee + processingFee + escrowFee;
        netAmount = _amount - totalFees;
        
        if (totalFees > (_amount * MAX_FEE) / BASIS_POINTS) revert InvalidFee();
    }
    
    function validatePaymentAmount(uint256 _amount) internal pure returns (bool) {
        return _amount >= MIN_PAYMENT && _amount <= MAX_PAYMENT;
    }
    
    function calculateNextDueDate(uint256 _lastPayment, uint256 _interval) 
        internal 
        pure 
        returns (uint256) 
    {
        if (_interval == 0) revert InvalidTimeframe();
        return _lastPayment + _interval;
    }
    
    function isPaymentOverdue(uint256 _dueDate) internal view returns (bool) {
        return block.timestamp > _dueDate;
    }
    
    function calculateLateFee(uint256 _amount, uint256 _daysLate) 
        internal 
        pure 
        returns (uint256) 
    {
        if (_daysLate == 0) return 0;
        
        uint256 dailyLateFeeRate = 10; // 0.1% per day
        uint256 maxLateFee = 1000; // 10% max
        
        uint256 lateFee = (_amount * dailyLateFeeRate * _daysLate) / BASIS_POINTS;
        uint256 maxFee = (_amount * maxLateFee) / BASIS_POINTS;
        
        return lateFee > maxFee ? maxFee : lateFee;
    }
    
    function validateRecurringInterval(uint256 _interval) internal pure returns (bool) {
        uint256 minInterval = 1 days;
        uint256 maxInterval = 365 days;
        return _interval >= minInterval && _interval <= maxInterval;
    }
    
    function calculateProRatedAmount(
        uint256 _fullAmount, 
        uint256 _daysUsed, 
        uint256 _totalDays
    ) internal pure returns (uint256) {
        if (_totalDays == 0) revert InvalidTimeframe();
        return (_fullAmount * _daysUsed) / _totalDays;
    }
    
    function getPaymentStatus(uint256 _dueDate, uint256 _paidDate) 
        internal 
        view 
        returns (string memory) 
    {
        if (_paidDate == 0) {
            return isPaymentOverdue(_dueDate) ? "Overdue" : "Pending";
        }
        
        if (_paidDate <= _dueDate) {
            return "Paid On Time";
        } else {
            return "Paid Late";
        }
    }
    
    function calculateEarlyPaymentDiscount(uint256 _amount, uint256 _daysEarly) 
        internal 
        pure 
        returns (uint256) 
    {
        if (_daysEarly == 0) return 0;
        
        uint256 maxDiscountDays = 30;
        uint256 maxDiscountRate = 50; // 0.5%
        
        uint256 discountDays = _daysEarly > maxDiscountDays ? maxDiscountDays : _daysEarly;
        uint256 discountRate = (maxDiscountRate * discountDays) / maxDiscountDays;
        
        return (_amount * discountRate) / BASIS_POINTS;
    }
}