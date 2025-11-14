// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IInterestRateModel {
    function getBorrowRate(uint256 totalDeposits, uint256 totalBorrows) external view returns (uint256);
    function getSupplyRate(uint256 totalDeposits, uint256 totalBorrows, uint256 reserveFactor) external view returns (uint256);
    function getUtilizationRate(uint256 totalDeposits, uint256 totalBorrows) external pure returns (uint256);
}
