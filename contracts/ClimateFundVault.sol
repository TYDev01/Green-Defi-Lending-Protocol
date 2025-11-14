// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title ClimateFundVault
 * @notice Staking vault that channels funds into sustainability initiatives
 * @dev Users stake tokens and earn rewards while supporting climate projects
 */
contract ClimateFundVault is ReentrancyGuard, Ownable {
    
    struct StakeInfo {
        uint256 amount;
        uint256 startTime;
        uint256 lastClaimTime;
        uint256 rewardDebt;
    }
    
    struct ClimateProject {
        string projectId;
        string name;
        string description;
        uint256 fundingGoal;
        uint256 currentFunding;
        address beneficiary;
        bool isActive;
        uint256 createdAt;
    }
    
    mapping(address => StakeInfo) public stakes;
    mapping(uint256 => ClimateProject) public projects;
    
    uint256 public totalStaked;
    uint256 public rewardRatePerYear = 8; // 8% APY
    uint256 public nextProjectId = 1;
    uint256 public totalProjectsFunded;
    
    address public greenToken;
    address public guardianVerifier;
    
    event Staked(address indexed user, uint256 amount);
    event Withdrawn(address indexed user, uint256 amount);
    event RewardsClaimed(address indexed user, uint256 amount);
    event ProjectCreated(uint256 indexed projectId, string name, uint256 fundingGoal);
    event ProjectFunded(uint256 indexed projectId, uint256 amount);
    event ProjectCompleted(uint256 indexed projectId);
    
    constructor() Ownable(msg.sender) {}
    
    /**
     * @notice Stake HBAR into the climate fund
     */
    function stake() external payable nonReentrant {
        require(msg.value > 0, "Must stake positive amount");
        
        _claimRewards(msg.sender);
        
        StakeInfo storage userStake = stakes[msg.sender];
        userStake.amount += msg.value;
        userStake.startTime = block.timestamp;
        
        totalStaked += msg.value;
        
        emit Staked(msg.sender, msg.value);
    }
    
    /**
     * @notice Withdraw staked HBAR
     * @param amount Amount to withdraw
     */
    function withdraw(uint256 amount) external nonReentrant {
        StakeInfo storage userStake = stakes[msg.sender];
        require(amount > 0 && amount <= userStake.amount, "Invalid amount");
        
        _claimRewards(msg.sender);
        
        userStake.amount -= amount;
        totalStaked -= amount;
        
        payable(msg.sender).transfer(amount);
        
        emit Withdrawn(msg.sender, amount);
    }
    
    /**
     * @notice Claim accumulated staking rewards
     */
    function claimRewards() external nonReentrant {
        _claimRewards(msg.sender);
    }
    
    /**
     * @notice Internal function to calculate and distribute rewards
     */
    function _claimRewards(address user) internal {
        StakeInfo storage userStake = stakes[user];
        
        if (userStake.amount == 0) {
            userStake.lastClaimTime = block.timestamp;
            return;
        }
        
        uint256 pendingRewards = calculatePendingRewards(user);
        
        if (pendingRewards > 0) {
            userStake.rewardDebt += pendingRewards;
            userStake.lastClaimTime = block.timestamp;
            
            // Transfer rewards (in GREEN tokens if set, otherwise HBAR)
            if (greenToken != address(0)) {
                // Call GREEN token transfer
                emit RewardsClaimed(user, pendingRewards);
            } else {
                payable(user).transfer(pendingRewards);
                emit RewardsClaimed(user, pendingRewards);
            }
        } else {
            userStake.lastClaimTime = block.timestamp;
        }
    }
    
    /**
     * @notice Calculate pending rewards for a user
     * @param user Address of the staker
     * @return Pending reward amount
     */
    function calculatePendingRewards(address user) public view returns (uint256) {
        StakeInfo memory userStake = stakes[user];
        
        if (userStake.amount == 0) return 0;
        
        uint256 stakingDuration = block.timestamp - (userStake.lastClaimTime > 0 ? userStake.lastClaimTime : userStake.startTime);
        
        // rewards = (amount * rate * duration) / (365 days * 100)
        uint256 rewards = (userStake.amount * rewardRatePerYear * stakingDuration) / (365 days * 100);
        
        return rewards;
    }
    
    /**
     * @notice Create a new climate project
     * @param name Project name
     * @param description Project description
     * @param fundingGoal Funding goal in HBAR
     * @param beneficiary Address to receive funds
     */
    function createProject(
        string memory name,
        string memory description,
        uint256 fundingGoal,
        address beneficiary
    ) external onlyOwner returns (uint256) {
        require(fundingGoal > 0, "Invalid funding goal");
        require(beneficiary != address(0), "Invalid beneficiary");
        
        uint256 projectId = nextProjectId++;
        
        projects[projectId] = ClimateProject({
            projectId: string(abi.encodePacked("PROJ-", uint2str(projectId))),
            name: name,
            description: description,
            fundingGoal: fundingGoal,
            currentFunding: 0,
            beneficiary: beneficiary,
            isActive: true,
            createdAt: block.timestamp
        });
        
        emit ProjectCreated(projectId, name, fundingGoal);
        
        return projectId;
    }
    
    /**
     * @notice Fund a climate project from vault reserves
     * @param projectId ID of the project
     * @param amount Amount to fund
     */
    function fundProject(uint256 projectId, uint256 amount) external onlyOwner nonReentrant {
        ClimateProject storage project = projects[projectId];
        require(project.isActive, "Project not active");
        require(amount > 0, "Invalid amount");
        require(amount <= address(this).balance - totalStaked, "Insufficient vault balance");
        
        project.currentFunding += amount;
        
        payable(project.beneficiary).transfer(amount);
        
        emit ProjectFunded(projectId, amount);
        
        // Check if fully funded
        if (project.currentFunding >= project.fundingGoal) {
            project.isActive = false;
            totalProjectsFunded++;
            emit ProjectCompleted(projectId);
        }
    }
    
    /**
     * @notice Get project details
     */
    function getProject(uint256 projectId) external view returns (
        string memory name,
        string memory description,
        uint256 fundingGoal,
        uint256 currentFunding,
        bool isActive
    ) {
        ClimateProject memory project = projects[projectId];
        return (
            project.name,
            project.description,
            project.fundingGoal,
            project.currentFunding,
            project.isActive
        );
    }
    
    /**
     * @notice Get user stake info
     */
    function getStakeInfo(address user) external view returns (
        uint256 amount,
        uint256 startTime,
        uint256 pendingRewards
    ) {
        StakeInfo memory userStake = stakes[user];
        return (
            userStake.amount,
            userStake.startTime,
            calculatePendingRewards(user)
        );
    }
    
    /**
     * @notice Update reward rate
     */
    function setRewardRate(uint256 newRate) external onlyOwner {
        require(newRate <= 100, "Rate too high");
        rewardRatePerYear = newRate;
    }
    
    /**
     * @notice Set GREEN token address
     */
    function setGreenToken(address _greenToken) external onlyOwner {
        greenToken = _greenToken;
    }
    
    /**
     * @notice Utility function to convert uint to string
     */
    function uint2str(uint256 _i) internal pure returns (string memory) {
        if (_i == 0) return "0";
        
        uint256 j = _i;
        uint256 len;
        while (j != 0) {
            len++;
            j /= 10;
        }
        
        bytes memory bstr = new bytes(len);
        uint256 k = len;
        while (_i != 0) {
            k = k - 1;
            uint8 temp = (48 + uint8(_i - _i / 10 * 10));
            bytes1 b1 = bytes1(temp);
            bstr[k] = b1;
            _i /= 10;
        }
        
        return string(bstr);
    }
    
    receive() external payable {}
}
