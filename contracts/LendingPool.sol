// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./interfaces/IInterestRateModel.sol";
import "./interfaces/IGreenRewardManager.sol";

/**
 * @title LendingPool
 * @notice Manages deposits, borrows, and repayments with dynamic interest rates
 * @dev Supports HBAR and HTS stablecoins with green reward integration
 */
contract LendingPool is ReentrancyGuard, Ownable {
    
    struct UserAccount {
        uint256 deposited;
        uint256 borrowed;
        uint256 lastUpdateTime;
        uint256 accruedInterest;
    }
    
    struct PoolStats {
        uint256 totalDeposits;
        uint256 totalBorrows;
        uint256 reserveFactor;
        uint256 lastUpdateTime;
    }
    
    mapping(address => UserAccount) public userAccounts;
    PoolStats public poolStats;
    
    IInterestRateModel public interestRateModel;
    IGreenRewardManager public greenRewardManager;
    
    uint256 public constant MAX_BORROW_RATIO = 80; // 80% collateralization
    uint256 public constant RESERVE_FACTOR = 10; // 10% of interest goes to reserves
    uint256 public reserveBalance;
    
    event Deposited(address indexed user, uint256 amount);
    event Borrowed(address indexed user, uint256 amount);
    event Repaid(address indexed user, uint256 amount, uint256 interest);
    event Withdrawn(address indexed user, uint256 amount);
    event InterestAccrued(address indexed user, uint256 interest);
    
    constructor(address _interestRateModel, address _greenRewardManager) Ownable(msg.sender) {
        interestRateModel = IInterestRateModel(_interestRateModel);
        greenRewardManager = IGreenRewardManager(_greenRewardManager);
        poolStats.lastUpdateTime = block.timestamp;
    }
    
    /**
     * @notice Deposit HBAR into the lending pool
     */
    function deposit() external payable nonReentrant {
        require(msg.value > 0, "Deposit amount must be greater than 0");
        
        _accrueInterest(msg.sender);
        
        userAccounts[msg.sender].deposited += msg.value;
        poolStats.totalDeposits += msg.value;
        
        emit Deposited(msg.sender, msg.value);
    }
    
    /**
     * @notice Borrow HBAR from the pool
     * @param amount Amount to borrow
     */
    function borrow(uint256 amount) external nonReentrant {
        require(amount > 0, "Borrow amount must be greater than 0");
        
        _accrueInterest(msg.sender);
        
        uint256 maxBorrow = (userAccounts[msg.sender].deposited * MAX_BORROW_RATIO) / 100;
        uint256 currentBorrow = userAccounts[msg.sender].borrowed + userAccounts[msg.sender].accruedInterest;
        
        require(currentBorrow + amount <= maxBorrow, "Exceeds borrowing capacity");
        require(amount <= _availableLiquidity(), "Insufficient liquidity");
        
        userAccounts[msg.sender].borrowed += amount;
        poolStats.totalBorrows += amount;
        
        payable(msg.sender).transfer(amount);
        
        emit Borrowed(msg.sender, amount);
    }
    
    /**
     * @notice Repay borrowed HBAR plus interest
     */
    function repay() external payable nonReentrant {
        require(msg.value > 0, "Repayment amount must be greater than 0");
        
        _accrueInterest(msg.sender);
        
        uint256 totalOwed = userAccounts[msg.sender].borrowed + userAccounts[msg.sender].accruedInterest;
        require(totalOwed > 0, "No outstanding debt");
        
        uint256 repayAmount = msg.value > totalOwed ? totalOwed : msg.value;
        uint256 interestPaid = 0;
        
        // Pay off interest first
        if (repayAmount <= userAccounts[msg.sender].accruedInterest) {
            userAccounts[msg.sender].accruedInterest -= repayAmount;
            interestPaid = repayAmount;
        } else {
            interestPaid = userAccounts[msg.sender].accruedInterest;
            uint256 principalPayment = repayAmount - interestPaid;
            
            userAccounts[msg.sender].accruedInterest = 0;
            userAccounts[msg.sender].borrowed -= principalPayment;
            poolStats.totalBorrows -= principalPayment;
        }
        
        // Allocate reserve
        uint256 reserveAmount = (interestPaid * RESERVE_FACTOR) / 100;
        reserveBalance += reserveAmount;
        
        // Refund excess
        if (msg.value > repayAmount) {
            payable(msg.sender).transfer(msg.value - repayAmount);
        }
        
        emit Repaid(msg.sender, repayAmount, interestPaid);
    }
    
    /**
     * @notice Withdraw deposited HBAR
     * @param amount Amount to withdraw
     */
    function withdraw(uint256 amount) external nonReentrant {
        require(amount > 0, "Withdrawal amount must be greater than 0");
        
        _accrueInterest(msg.sender);
        
        uint256 maxWithdraw = userAccounts[msg.sender].deposited;
        uint256 totalOwed = userAccounts[msg.sender].borrowed + userAccounts[msg.sender].accruedInterest;
        
        if (totalOwed > 0) {
            // Must maintain collateral ratio
            maxWithdraw = userAccounts[msg.sender].deposited - ((totalOwed * 100) / MAX_BORROW_RATIO);
        }
        
        require(amount <= maxWithdraw, "Exceeds withdrawable amount");
        require(amount <= _availableLiquidity(), "Insufficient liquidity");
        
        userAccounts[msg.sender].deposited -= amount;
        poolStats.totalDeposits -= amount;
        
        payable(msg.sender).transfer(amount);
        
        emit Withdrawn(msg.sender, amount);
    }
    
    /**
     * @notice Accrue interest for a user based on their borrowed amount
     * @param user Address of the user
     */
    function _accrueInterest(address user) internal {
        UserAccount storage account = userAccounts[user];
        
        if (account.borrowed == 0) {
            account.lastUpdateTime = block.timestamp;
            return;
        }
        
        uint256 timeElapsed = block.timestamp - account.lastUpdateTime;
        if (timeElapsed == 0) return;
        
        // Get interest rate (adjusted for green rewards)
        uint256 baseRate = interestRateModel.getBorrowRate(
            poolStats.totalDeposits,
            poolStats.totalBorrows
        );
        
        uint256 adjustedRate = greenRewardManager.getAdjustedInterestRate(user, baseRate);
        
        // Calculate interest: (principal * rate * time) / (365 days * 100)
        uint256 interest = (account.borrowed * adjustedRate * timeElapsed) / (365 days * 100);
        
        account.accruedInterest += interest;
        account.lastUpdateTime = block.timestamp;
        
        emit InterestAccrued(user, interest);
    }
    
    /**
     * @notice Get available liquidity in the pool
     */
    function _availableLiquidity() internal view returns (uint256) {
        return address(this).balance - reserveBalance;
    }
    
    /**
     * @notice Get user's current debt including accrued interest
     * @param user Address of the user
     */
    function getUserDebt(address user) external view returns (uint256) {
        UserAccount memory account = userAccounts[user];
        
        if (account.borrowed == 0) return 0;
        
        uint256 timeElapsed = block.timestamp - account.lastUpdateTime;
        uint256 baseRate = interestRateModel.getBorrowRate(
            poolStats.totalDeposits,
            poolStats.totalBorrows
        );
        uint256 adjustedRate = greenRewardManager.getAdjustedInterestRate(user, baseRate);
        uint256 pendingInterest = (account.borrowed * adjustedRate * timeElapsed) / (365 days * 100);
        
        return account.borrowed + account.accruedInterest + pendingInterest;
    }
    
    /**
     * @notice Get pool utilization rate
     */
    function getUtilizationRate() external view returns (uint256) {
        if (poolStats.totalDeposits == 0) return 0;
        return (poolStats.totalBorrows * 100) / poolStats.totalDeposits;
    }
    
    /**
     * @notice Update interest rate model
     */
    function setInterestRateModel(address _newModel) external onlyOwner {
        interestRateModel = IInterestRateModel(_newModel);
    }
    
    /**
     * @notice Update green reward manager
     */
    function setGreenRewardManager(address _newManager) external onlyOwner {
        greenRewardManager = IGreenRewardManager(_newManager);
    }
}
