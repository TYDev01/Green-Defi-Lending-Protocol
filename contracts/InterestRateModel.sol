// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title InterestRateModel
 * @notice Calculates dynamic interest rates based on pool utilization
 * @dev Uses a kinked interest rate model
 */
contract InterestRateModel is Ownable {
    
    uint256 public baseRatePerYear; // Base rate when utilization is 0%
    uint256 public multiplierPerYear; // Rate of increase before kink
    uint256 public jumpMultiplierPerYear; // Rate of increase after kink
    uint256 public kink; // Utilization point where rate jumps
    
    event InterestRateModelUpdated(
        uint256 baseRate,
        uint256 multiplier,
        uint256 jumpMultiplier,
        uint256 kinkPoint
    );
    
    /**
     * @param _baseRatePerYear Base interest rate (e.g., 2 for 2%)
     * @param _multiplierPerYear Multiplier before kink (e.g., 10 for 10%)
     * @param _jumpMultiplierPerYear Jump multiplier after kink (e.g., 100 for 100%)
     * @param _kink Kink point (e.g., 80 for 80% utilization)
     */
    constructor(
        uint256 _baseRatePerYear,
        uint256 _multiplierPerYear,
        uint256 _jumpMultiplierPerYear,
        uint256 _kink
    ) Ownable(msg.sender) {
        baseRatePerYear = _baseRatePerYear;
        multiplierPerYear = _multiplierPerYear;
        jumpMultiplierPerYear = _jumpMultiplierPerYear;
        kink = _kink;
        
        emit InterestRateModelUpdated(_baseRatePerYear, _multiplierPerYear, _jumpMultiplierPerYear, _kink);
    }
    
    /**
     * @notice Calculate borrow rate based on utilization
     * @param totalDeposits Total deposits in the pool
     * @param totalBorrows Total borrows from the pool
     * @return Annual borrow rate as a percentage
     */
    function getBorrowRate(
        uint256 totalDeposits,
        uint256 totalBorrows
    ) external view returns (uint256) {
        if (totalDeposits == 0) {
            return baseRatePerYear;
        }
        
        uint256 utilization = (totalBorrows * 100) / totalDeposits;
        
        if (utilization <= kink) {
            // Below kink: baseRate + (utilization * multiplier / 100)
            return baseRatePerYear + (utilization * multiplierPerYear) / 100;
        } else {
            // Above kink: baseRate + (kink * multiplier / 100) + ((utilization - kink) * jumpMultiplier / 100)
            uint256 normalRate = baseRatePerYear + (kink * multiplierPerYear) / 100;
            uint256 excessUtil = utilization - kink;
            return normalRate + (excessUtil * jumpMultiplierPerYear) / 100;
        }
    }
    
    /**
     * @notice Calculate supply rate based on borrow rate and utilization
     * @param totalDeposits Total deposits in the pool
     * @param totalBorrows Total borrows from the pool
     * @param reserveFactor Percentage of interest going to reserves
     * @return Annual supply rate as a percentage
     */
    function getSupplyRate(
        uint256 totalDeposits,
        uint256 totalBorrows,
        uint256 reserveFactor
    ) external view returns (uint256) {
        if (totalDeposits == 0) {
            return 0;
        }
        
        uint256 borrowRate = this.getBorrowRate(totalDeposits, totalBorrows);
        uint256 utilization = (totalBorrows * 100) / totalDeposits;
        
        // supplyRate = borrowRate * utilization * (1 - reserveFactor)
        uint256 rateToPool = borrowRate * (100 - reserveFactor) / 100;
        return (rateToPool * utilization) / 100;
    }
    
    /**
     * @notice Get current utilization rate
     * @param totalDeposits Total deposits in the pool
     * @param totalBorrows Total borrows from the pool
     * @return Utilization as a percentage
     */
    function getUtilizationRate(
        uint256 totalDeposits,
        uint256 totalBorrows
    ) external pure returns (uint256) {
        if (totalDeposits == 0) {
            return 0;
        }
        return (totalBorrows * 100) / totalDeposits;
    }
    
    /**
     * @notice Update interest rate model parameters
     */
    function updateModel(
        uint256 _baseRatePerYear,
        uint256 _multiplierPerYear,
        uint256 _jumpMultiplierPerYear,
        uint256 _kink
    ) external onlyOwner {
        require(_kink <= 100, "Kink must be <= 100");
        
        baseRatePerYear = _baseRatePerYear;
        multiplierPerYear = _multiplierPerYear;
        jumpMultiplierPerYear = _jumpMultiplierPerYear;
        kink = _kink;
        
        emit InterestRateModelUpdated(_baseRatePerYear, _multiplierPerYear, _jumpMultiplierPerYear, _kink);
    }
}
