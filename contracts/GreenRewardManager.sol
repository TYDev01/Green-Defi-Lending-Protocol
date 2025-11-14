// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title GreenRewardManager
 * @notice Manages Guardian-verified Carbon Credit NFTs and interest rate adjustments
 * @dev Integrates with Hedera Guardian for verification and HTS for NFT minting
 */
contract GreenRewardManager is Ownable, ReentrancyGuard {
    
    struct CarbonCreditNFT {
        uint256 tokenId;
        address owner;
        uint256 carbonTonsOffset;
        string guardianVerificationId;
        uint256 mintTimestamp;
        bool isRetired;
        string issuer;
        string projectId;
    }
    
    struct UserGreenProfile {
        uint256[] nftIds;
        uint256 totalCarbonOffset;
        uint256 activeNFTCount;
        uint256 lastRewardTimestamp;
        uint256 rewardMultiplier; // basis points (100 = 1%)
    }
    
    mapping(uint256 => CarbonCreditNFT) public carbonNFTs;
    mapping(address => UserGreenProfile) public userProfiles;
    mapping(string => bool) public usedVerificationIds;
    
    uint256 public nextTokenId = 1;
    uint256 public constant BASE_RATE_REDUCTION = 10; // 10% reduction per NFT
    uint256 public constant MAX_RATE_REDUCTION = 50; // Max 50% reduction
    uint256 public constant MIN_CARBON_TONS = 1; // Minimum 1 ton per NFT
    
    address public guardianOracle; // Oracle that verifies Guardian data
    address public greenToken; // GREEN reward token address
    address public leaderboardTracker;
    
    event NFTMinted(uint256 indexed tokenId, address indexed owner, uint256 carbonTons, string verificationId);
    event NFTRetired(uint256 indexed tokenId, address indexed owner);
    event InterestRateAdjusted(address indexed user, uint256 newRate, uint256 reduction);
    event GreenTokenRewarded(address indexed user, uint256 amount);
    event GuardianOracleUpdated(address indexed newOracle);
    
    modifier onlyGuardianOracle() {
        require(msg.sender == guardianOracle, "Only Guardian Oracle");
        _;
    }
    
    constructor(address _guardianOracle) Ownable(msg.sender) {
        guardianOracle = _guardianOracle;
    }
    
    /**
     * @notice Mint a new Carbon Credit NFT based on Guardian verification
     * @param recipient Address receiving the NFT
     * @param carbonTons Amount of CO2 offset in tons
     * @param verificationId Guardian verification ID
     * @param issuer Issuer of the carbon credit
     * @param projectId Associated sustainability project ID
     */
    function mintCarbonNFT(
        address recipient,
        uint256 carbonTons,
        string memory verificationId,
        string memory issuer,
        string memory projectId
    ) external onlyGuardianOracle nonReentrant returns (uint256) {
        require(recipient != address(0), "Invalid recipient");
        require(carbonTons >= MIN_CARBON_TONS, "Below minimum carbon tons");
        require(!usedVerificationIds[verificationId], "Verification ID already used");
        
        uint256 tokenId = nextTokenId++;
        
        carbonNFTs[tokenId] = CarbonCreditNFT({
            tokenId: tokenId,
            owner: recipient,
            carbonTonsOffset: carbonTons,
            guardianVerificationId: verificationId,
            mintTimestamp: block.timestamp,
            isRetired: false,
            issuer: issuer,
            projectId: projectId
        });
        
        usedVerificationIds[verificationId] = true;
        
        UserGreenProfile storage profile = userProfiles[recipient];
        profile.nftIds.push(tokenId);
        profile.totalCarbonOffset += carbonTons;
        profile.activeNFTCount++;
        
        // Update reward multiplier based on total offsets
        _updateRewardMultiplier(recipient);
        
        // Update leaderboard if tracker is set
        if (leaderboardTracker != address(0)) {
            ILeaderboardTracker(leaderboardTracker).updateScore(recipient, carbonTons);
        }
        
        emit NFTMinted(tokenId, recipient, carbonTons, verificationId);
        
        return tokenId;
    }
    
    /**
     * @notice Retire a Carbon Credit NFT (permanent impact recorded)
     * @param tokenId ID of the NFT to retire
     */
    function retireNFT(uint256 tokenId) external nonReentrant {
        CarbonCreditNFT storage nft = carbonNFTs[tokenId];
        require(nft.owner == msg.sender, "Not NFT owner");
        require(!nft.isRetired, "NFT already retired");
        
        nft.isRetired = true;
        userProfiles[msg.sender].activeNFTCount--;
        
        // Award bonus GREEN tokens for retirement
        if (greenToken != address(0)) {
            uint256 bonusAmount = nft.carbonTonsOffset * 100 * 10**18; // 100 GREEN per ton
            _rewardGreenTokens(msg.sender, bonusAmount);
        }
        
        emit NFTRetired(tokenId, msg.sender);
    }
    
    /**
     * @notice Get adjusted interest rate for a user based on their carbon NFTs
     * @param user Address of the borrower
     * @param baseRate Base interest rate from the interest rate model
     * @return Adjusted interest rate
     */
    function getAdjustedInterestRate(address user, uint256 baseRate) external view returns (uint256) {
        UserGreenProfile memory profile = userProfiles[user];
        
        if (profile.activeNFTCount == 0) {
            return baseRate;
        }
        
        // Calculate reduction: min(activeNFTCount * BASE_RATE_REDUCTION, MAX_RATE_REDUCTION)
        uint256 reductionPercent = profile.activeNFTCount * BASE_RATE_REDUCTION;
        if (reductionPercent > MAX_RATE_REDUCTION) {
            reductionPercent = MAX_RATE_REDUCTION;
        }
        
        uint256 reduction = (baseRate * reductionPercent) / 100;
        return baseRate - reduction;
    }
    
    /**
     * @notice Get user's green profile information
     * @param user Address of the user
     */
    function getUserProfile(address user) external view returns (
        uint256 totalNFTs,
        uint256 totalCarbonOffset,
        uint256 activeNFTs,
        uint256 rewardMultiplier
    ) {
        UserGreenProfile memory profile = userProfiles[user];
        return (
            profile.nftIds.length,
            profile.totalCarbonOffset,
            profile.activeNFTCount,
            profile.rewardMultiplier
        );
    }
    
    /**
     * @notice Get NFT details
     * @param tokenId ID of the NFT
     */
    function getNFTDetails(uint256 tokenId) external view returns (
        address owner,
        uint256 carbonTons,
        string memory verificationId,
        uint256 timestamp,
        bool retired,
        string memory issuer
    ) {
        CarbonCreditNFT memory nft = carbonNFTs[tokenId];
        return (
            nft.owner,
            nft.carbonTonsOffset,
            nft.guardianVerificationId,
            nft.mintTimestamp,
            nft.isRetired,
            nft.issuer
        );
    }
    
    /**
     * @notice Get all NFT IDs owned by a user
     * @param user Address of the user
     */
    function getUserNFTs(address user) external view returns (uint256[] memory) {
        return userProfiles[user].nftIds;
    }
    
    /**
     * @notice Update reward multiplier based on total carbon offset
     * @param user Address of the user
     */
    function _updateRewardMultiplier(address user) internal {
        UserGreenProfile storage profile = userProfiles[user];
        
        // Multiplier tiers: 
        // 0-10 tons: 100 (1.0x)
        // 10-50 tons: 150 (1.5x)
        // 50-100 tons: 200 (2.0x)
        // 100+ tons: 250 (2.5x)
        
        if (profile.totalCarbonOffset >= 100) {
            profile.rewardMultiplier = 250;
        } else if (profile.totalCarbonOffset >= 50) {
            profile.rewardMultiplier = 200;
        } else if (profile.totalCarbonOffset >= 10) {
            profile.rewardMultiplier = 150;
        } else {
            profile.rewardMultiplier = 100;
        }
    }
    
    /**
     * @notice Reward GREEN tokens to user
     * @param user Address receiving tokens
     * @param amount Amount of tokens to reward
     */
    function _rewardGreenTokens(address user, uint256 amount) internal {
        // Implementation would call GREEN token contract to mint/transfer
        emit GreenTokenRewarded(user, amount);
    }
    
    /**
     * @notice Set Guardian Oracle address
     */
    function setGuardianOracle(address _newOracle) external onlyOwner {
        require(_newOracle != address(0), "Invalid oracle address");
        guardianOracle = _newOracle;
        emit GuardianOracleUpdated(_newOracle);
    }
    
    /**
     * @notice Set GREEN token address
     */
    function setGreenToken(address _greenToken) external onlyOwner {
        require(_greenToken != address(0), "Invalid token address");
        greenToken = _greenToken;
    }
    
    /**
     * @notice Set Leaderboard Tracker address
     */
    function setLeaderboardTracker(address _tracker) external onlyOwner {
        leaderboardTracker = _tracker;
    }
}

interface ILeaderboardTracker {
    function updateScore(address user, uint256 carbonTons) external;
}
