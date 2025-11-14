const hre = require("hardhat");
const { ethers } = require("hardhat");

async function main() {
  console.log("Starting deployment to Hedera...");

  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", ethers.formatEther(balance), "HBAR");

  // Deploy InterestRateModel
  console.log("\nDeploying InterestRateModel...");
  const InterestRateModel = await ethers.getContractFactory("InterestRateModel");
  const interestRateModel = await InterestRateModel.deploy(
    2,   // 2% base rate
    10,  // 10% multiplier
    100, // 100% jump multiplier
    80   // 80% kink point
  );
  await interestRateModel.waitForDeployment();
  const interestRateAddress = await interestRateModel.getAddress();
  console.log("InterestRateModel deployed to:", interestRateAddress);

  // Deploy LeaderboardTracker (temporary address, will update later)
  console.log("\nDeploying LeaderboardTracker...");
  const LeaderboardTracker = await ethers.getContractFactory("LeaderboardTracker");
  const leaderboardTracker = await LeaderboardTracker.deploy(ethers.ZeroAddress);
  await leaderboardTracker.waitForDeployment();
  const leaderboardAddress = await leaderboardTracker.getAddress();
  console.log("LeaderboardTracker deployed to:", leaderboardAddress);

  // Deploy GreenRewardManager
  console.log("\nDeploying GreenRewardManager...");
  const GreenRewardManager = await ethers.getContractFactory("GreenRewardManager");
  const greenRewardManager = await GreenRewardManager.deploy(deployer.address); // Guardian Oracle
  await greenRewardManager.waitForDeployment();
  const greenRewardAddress = await greenRewardManager.getAddress();
  console.log("GreenRewardManager deployed to:", greenRewardAddress);

  // Update LeaderboardTracker with GreenRewardManager address
  console.log("\nLinking LeaderboardTracker to GreenRewardManager...");
  await leaderboardTracker.setGreenRewardManager(greenRewardAddress);
  console.log("LeaderboardTracker linked");

  // Update GreenRewardManager with LeaderboardTracker address
  console.log("\nLinking GreenRewardManager to LeaderboardTracker...");
  await greenRewardManager.setLeaderboardTracker(leaderboardAddress);
  console.log("GreenRewardManager linked");

  // Deploy LendingPool
  console.log("\nDeploying LendingPool...");
  const LendingPool = await ethers.getContractFactory("LendingPool");
  const lendingPool = await LendingPool.deploy(
    interestRateAddress,
    greenRewardAddress
  );
  await lendingPool.waitForDeployment();
  const lendingPoolAddress = await lendingPool.getAddress();
  console.log("LendingPool deployed to:", lendingPoolAddress);

  // Deploy ClimateFundVault
  console.log("\nDeploying ClimateFundVault...");
  const ClimateFundVault = await ethers.getContractFactory("ClimateFundVault");
  const climateFundVault = await ClimateFundVault.deploy();
  await climateFundVault.waitForDeployment();
  const vaultAddress = await climateFundVault.getAddress();
  console.log("ClimateFundVault deployed to:", vaultAddress);

  // Summary
  console.log("\n" + "=".repeat(60));
  console.log("Deployment Complete!");
  console.log("=".repeat(60));
  console.log("\nContract Addresses:");
  console.log("LendingPool:", lendingPoolAddress);
  console.log("GreenRewardManager:", greenRewardAddress);
  console.log("InterestRateModel:", interestRateAddress);
  console.log("ClimateFundVault:", vaultAddress);
  console.log("LeaderboardTracker:", leaderboardAddress);

  console.log("\nNext Steps:");
  console.log("1. Update .env with the contract addresses above");
  console.log("2. Set up Guardian Oracle address in GreenRewardManager");
  console.log("3. Configure backend services with contract addresses");
  console.log("4. Start frontend and backend servers");

  // Save addresses to file
  const fs = require('fs');
  const addresses = {
    lendingPool: lendingPoolAddress,
    greenRewardManager: greenRewardAddress,
    interestRateModel: interestRateAddress,
    climateFundVault: vaultAddress,
    leaderboardTracker: leaderboardAddress,
    network: hre.network.name,
    deployer: deployer.address,
    timestamp: new Date().toISOString()
  };

  fs.writeFileSync(
    'deployed-addresses.json',
    JSON.stringify(addresses, null, 2)
  );
  console.log("\nAddresses saved to deployed-addresses.json");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
