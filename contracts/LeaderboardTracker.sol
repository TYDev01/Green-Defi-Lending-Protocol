// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title LeaderboardTracker
 * @notice Tracks and ranks users by their carbon offset contributions
 * @dev Implements a gamified leaderboard system with badges and multipliers
 */
contract LeaderboardTracker is Ownable {
    
    struct UserScore {
        address user;
        uint256 totalCarbonOffset;
        uint256 nftCount;
        uint256 rank;
        uint256 lastUpdateTime;
        Badge badge;
    }
    
    enum Badge {
        NONE,
        ECO_STARTER,      // 1-10 tons
        GREEN_CHAMPION,   // 10-50 tons
        CLIMATE_HERO,     // 50-100 tons
        EARTH_GUARDIAN    // 100+ tons
    }
    
    mapping(address => UserScore) public userScores;
    address[] public topContributors;
    
    uint256 public constant LEADERBOARD_SIZE = 100;
    uint256 public totalUsers;
    uint256 public totalCarbonOffset;
    
    address public greenRewardManager;
    
    event ScoreUpdated(address indexed user, uint256 newScore, uint256 rank);
    event BadgeAwarded(address indexed user, Badge badge);
    event RankChanged(address indexed user, uint256 oldRank, uint256 newRank);
    
    modifier onlyRewardManager() {
        require(msg.sender == greenRewardManager, "Only GreenRewardManager");
        _;
    }
    
    constructor(address _greenRewardManager) Ownable(msg.sender) {
        greenRewardManager = _greenRewardManager;
    }
    
    /**
     * @notice Update user's score when they offset carbon
     * @param user Address of the user
     * @param carbonTons Amount of carbon offset in tons
     */
    function updateScore(address user, uint256 carbonTons) external onlyRewardManager {
        UserScore storage score = userScores[user];
        
        if (score.user == address(0)) {
            score.user = user;
            totalUsers++;
        }
        
        uint256 oldTotal = score.totalCarbonOffset;
        score.totalCarbonOffset += carbonTons;
        score.nftCount++;
        score.lastUpdateTime = block.timestamp;
        
        totalCarbonOffset += carbonTons;
        
        // Update badge
        Badge newBadge = _calculateBadge(score.totalCarbonOffset);
        if (newBadge != score.badge) {
            score.badge = newBadge;
            emit BadgeAwarded(user, newBadge);
        }
        
        // Update leaderboard position
        _updateLeaderboard(user);
        
        emit ScoreUpdated(user, score.totalCarbonOffset, score.rank);
    }
    
    /**
     * @notice Update leaderboard rankings
     * @param user Address of the user to update
     */
    function _updateLeaderboard(address user) internal {
        UserScore storage score = userScores[user];
        uint256 oldRank = score.rank;
        
        // Remove user from current position if exists
        if (oldRank > 0 && oldRank <= topContributors.length) {
            // Find and remove
            for (uint256 i = 0; i < topContributors.length; i++) {
                if (topContributors[i] == user) {
                    // Shift array
                    for (uint256 j = i; j < topContributors.length - 1; j++) {
                        topContributors[j] = topContributors[j + 1];
                    }
                    topContributors.pop();
                    break;
                }
            }
        }
        
        // Find correct position for user
        uint256 newPosition = topContributors.length;
        for (uint256 i = 0; i < topContributors.length; i++) {
            if (score.totalCarbonOffset > userScores[topContributors[i]].totalCarbonOffset) {
                newPosition = i;
                break;
            }
        }
        
        // Insert at correct position
        if (newPosition < LEADERBOARD_SIZE) {
            if (topContributors.length < LEADERBOARD_SIZE) {
                topContributors.push(address(0));
            }
            
            // Shift elements
            for (uint256 i = topContributors.length - 1; i > newPosition; i--) {
                topContributors[i] = topContributors[i - 1];
            }
            
            topContributors[newPosition] = user;
            score.rank = newPosition + 1;
            
            // Update ranks for affected users
            for (uint256 i = 0; i < topContributors.length; i++) {
                userScores[topContributors[i]].rank = i + 1;
            }
            
            if (oldRank != score.rank) {
                emit RankChanged(user, oldRank, score.rank);
            }
        }
    }
    
    /**
     * @notice Calculate badge based on total carbon offset
     */
    function _calculateBadge(uint256 totalOffset) internal pure returns (Badge) {
        if (totalOffset >= 100) {
            return Badge.EARTH_GUARDIAN;
        } else if (totalOffset >= 50) {
            return Badge.CLIMATE_HERO;
        } else if (totalOffset >= 10) {
            return Badge.GREEN_CHAMPION;
        } else if (totalOffset >= 1) {
            return Badge.ECO_STARTER;
        }
        return Badge.NONE;
    }
    
    /**
     * @notice Get top N contributors
     * @param count Number of top contributors to return
     */
    function getTopContributors(uint256 count) external view returns (address[] memory, uint256[] memory) {
        uint256 returnCount = count > topContributors.length ? topContributors.length : count;
        
        address[] memory contributors = new address[](returnCount);
        uint256[] memory scores = new uint256[](returnCount);
        
        for (uint256 i = 0; i < returnCount; i++) {
            contributors[i] = topContributors[i];
            scores[i] = userScores[topContributors[i]].totalCarbonOffset;
        }
        
        return (contributors, scores);
    }
    
    /**
     * @notice Get user's detailed score information
     */
    function getUserScore(address user) external view returns (
        uint256 totalOffset,
        uint256 nftCount,
        uint256 rank,
        Badge badge,
        string memory badgeName
    ) {
        UserScore memory score = userScores[user];
        return (
            score.totalCarbonOffset,
            score.nftCount,
            score.rank,
            score.badge,
            _getBadgeName(score.badge)
        );
    }
    
    /**
     * @notice Get badge name as string
     */
    function _getBadgeName(Badge badge) internal pure returns (string memory) {
        if (badge == Badge.EARTH_GUARDIAN) return "Earth Guardian";
        if (badge == Badge.CLIMATE_HERO) return "Climate Hero";
        if (badge == Badge.GREEN_CHAMPION) return "Green Champion";
        if (badge == Badge.ECO_STARTER) return "Eco Starter";
        return "None";
    }
    
    /**
     * @notice Get leaderboard statistics
     */
    function getLeaderboardStats() external view returns (
        uint256 _totalUsers,
        uint256 _totalCarbonOffset,
        uint256 _topContributorsCount
    ) {
        return (totalUsers, totalCarbonOffset, topContributors.length);
    }
    
    /**
     * @notice Check if user is in top N
     */
    function isTopContributor(address user, uint256 topN) external view returns (bool) {
        UserScore memory score = userScores[user];
        return score.rank > 0 && score.rank <= topN;
    }
    
    /**
     * @notice Get rank multiplier for rewards (top 10 get bonus)
     */
    function getRankMultiplier(address user) external view returns (uint256) {
        UserScore memory score = userScores[user];
        
        if (score.rank == 0) return 100; // 1.0x
        if (score.rank == 1) return 200; // 2.0x
        if (score.rank <= 3) return 175; // 1.75x
        if (score.rank <= 10) return 150; // 1.5x
        if (score.rank <= 50) return 125; // 1.25x
        
        return 100; // 1.0x
    }
    
    /**
     * @notice Update GreenRewardManager address
     */
    function setGreenRewardManager(address _manager) external onlyOwner {
        require(_manager != address(0), "Invalid address");
        greenRewardManager = _manager;
    }
}
