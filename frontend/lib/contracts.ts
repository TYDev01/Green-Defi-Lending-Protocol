import { ethers } from 'ethers';

// Contract ABIs (simplified - in production, import from artifacts)
export const LENDING_POOL_ABI = [
  'function deposit() external payable',
  'function borrow(uint256 amount) external',
  'function repay() external payable',
  'function withdraw(uint256 amount) external',
  'function getUserDebt(address user) external view returns (uint256)',
  'function userAccounts(address) external view returns (uint256 deposited, uint256 borrowed, uint256 lastUpdateTime, uint256 accruedInterest)',
  'function poolStats() external view returns (uint256 totalDeposits, uint256 totalBorrows, uint256 reserveFactor, uint256 lastUpdateTime)',
  'function getUtilizationRate() external view returns (uint256)',
  'event Deposited(address indexed user, uint256 amount)',
  'event Borrowed(address indexed user, uint256 amount)',
  'event Repaid(address indexed user, uint256 amount, uint256 interest)',
  'event Withdrawn(address indexed user, uint256 amount)',
];

export const GREEN_REWARD_MANAGER_ABI = [
  'function getUserProfile(address user) external view returns (uint256, uint256, uint256, uint256)',
  'function getUserNFTs(address user) external view returns (uint256[] memory)',
  'function getNFTDetails(uint256 tokenId) external view returns (address, uint256, string memory, uint256, bool, string memory)',
  'function retireNFT(uint256 tokenId) external',
  'function getAdjustedInterestRate(address user, uint256 baseRate) external view returns (uint256)',
  'event NFTMinted(uint256 indexed tokenId, address indexed owner, uint256 carbonTons, string verificationId)',
  'event NFTRetired(uint256 indexed tokenId, address indexed owner)',
];

export const INTEREST_RATE_MODEL_ABI = [
  'function getBorrowRate(uint256 totalDeposits, uint256 totalBorrows) external view returns (uint256)',
  'function getSupplyRate(uint256 totalDeposits, uint256 totalBorrows, uint256 reserveFactor) external view returns (uint256)',
];

export const CLIMATE_FUND_VAULT_ABI = [
  'function stake() external payable',
  'function withdraw(uint256 amount) external',
  'function claimRewards() external',
  'function calculatePendingRewards(address user) external view returns (uint256)',
  'function getStakeInfo(address user) external view returns (uint256, uint256, uint256)',
  'function totalStaked() external view returns (uint256)',
  'function rewardRatePerYear() external view returns (uint256)',
  'event Staked(address indexed user, uint256 amount)',
  'event Withdrawn(address indexed user, uint256 amount)',
  'event RewardsClaimed(address indexed user, uint256 amount)',
];

export const LEADERBOARD_TRACKER_ABI = [
  'function getUserScore(address user) external view returns (uint256, uint256, uint256, uint8, string memory)',
  'function getTopContributors(uint256 count) external view returns (address[] memory, uint256[] memory)',
  'function getLeaderboardStats() external view returns (uint256, uint256, uint256)',
  'function isTopContributor(address user, uint256 topN) external view returns (bool)',
  'function getRankMultiplier(address user) external view returns (uint256)',
];

// Contract addresses
export const CONTRACTS = {
  LENDING_POOL: process.env.NEXT_PUBLIC_LENDING_POOL_ADDRESS || '',
  GREEN_REWARD_MANAGER: process.env.NEXT_PUBLIC_GREEN_REWARD_MANAGER_ADDRESS || '',
  INTEREST_RATE_MODEL: process.env.NEXT_PUBLIC_INTEREST_RATE_MODEL_ADDRESS || '',
  CLIMATE_FUND_VAULT: process.env.NEXT_PUBLIC_CLIMATE_FUND_VAULT_ADDRESS || '',
  LEADERBOARD_TRACKER: process.env.NEXT_PUBLIC_LEADERBOARD_TRACKER_ADDRESS || '',
};

// Helper to get contract instance
export function getContract(
  address: string,
  abi: any[],
  signerOrProvider: ethers.Signer | ethers.Provider
) {
  return new ethers.Contract(address, abi, signerOrProvider);
}

// Helper to format HBAR amounts
export function formatHBAR(amount: bigint | string): string {
  return parseFloat(ethers.formatEther(amount)).toFixed(4);
}

// Helper to parse HBAR amounts
export function parseHBAR(amount: string): bigint {
  return ethers.parseEther(amount);
}
