// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IGreenRewardManager {
    function mintCarbonNFT(
        address recipient,
        uint256 carbonTons,
        string memory verificationId,
        string memory issuer,
        string memory projectId
    ) external returns (uint256);
    
    function getAdjustedInterestRate(address user, uint256 baseRate) external view returns (uint256);
    function getUserProfile(address user) external view returns (uint256, uint256, uint256, uint256);
    function retireNFT(uint256 tokenId) external;
}
