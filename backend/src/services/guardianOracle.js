const axios = require('axios');
const { ethers } = require('ethers');
require('dotenv').config();

/**
 * Guardian Oracle Service
 * Listens to Guardian Framework for verified carbon credit data
 * and triggers smart contract NFT minting
 */
class GuardianOracle {
  constructor() {
    this.guardianApiUrl = process.env.GUARDIAN_API_URL;
    this.guardianApiKey = process.env.GUARDIAN_API_KEY;
    this.provider = new ethers.JsonRpcProvider(process.env.HEDERA_TESTNET_RPC);
    this.wallet = new ethers.Wallet(process.env.PRIVATE_KEY, this.provider);
    
    // Load contract ABIs
    this.greenRewardManagerAddress = process.env.GREEN_REWARD_MANAGER_ADDRESS;
    this.greenRewardManager = null; // Will be initialized with ABI
    
    this.pollingInterval = 60000; // Poll every 60 seconds
  }

  /**
   * Initialize the oracle service
   */
  async initialize() {
    console.log('Guardian Oracle starting...');
    
    // Load GreenRewardManager contract
    const GreenRewardManagerABI = require('../../artifacts/contracts/GreenRewardManager.sol/GreenRewardManager.json');
    this.greenRewardManager = new ethers.Contract(
      this.greenRewardManagerAddress,
      GreenRewardManagerABI.abi,
      this.wallet
    );
    
    console.log('Guardian Oracle initialized');
    this.startPolling();
  }

  /**
   * Start polling Guardian API for new verified carbon credits
   */
  startPolling() {
    console.log('Starting Guardian polling...');
    
    setInterval(async () => {
      try {
        await this.checkForNewVerifications();
      } catch (error) {
        console.error('Polling error:', error.message);
      }
    }, this.pollingInterval);
  }

  /**
   * Check Guardian API for new carbon credit verifications
   */
  async checkForNewVerifications() {
    try {
      const response = await axios.get(
        `${this.guardianApiUrl}/api/v1/verifications/pending`,
        {
          headers: {
            'Authorization': `Bearer ${this.guardianApiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const verifications = response.data;
      
      if (verifications && verifications.length > 0) {
        console.log(`Found ${verifications.length} new verifications`);
        
        for (const verification of verifications) {
          await this.processVerification(verification);
        }
      }
    } catch (error) {
      console.error('Error fetching verifications:', error.message);
    }
  }

  /**
   * Process a single verification and mint NFT
   */
  async processVerification(verification) {
    try {
      const {
        verificationId,
        recipientAddress,
        carbonTonsOffset,
        issuer,
        projectId,
        verifiableCredentials
      } = verification;

      console.log(`🔍 Processing verification ${verificationId}`);

      // Validate verification data
      if (!this.validateVerification(verification)) {
        console.error('Invalid verification data');
        return;
      }

      // Call smart contract to mint Carbon Credit NFT
      const tx = await this.greenRewardManager.mintCarbonNFT(
        recipientAddress,
        ethers.parseUnits(carbonTonsOffset.toString(), 0),
        verificationId,
        issuer,
        projectId
      );

      console.log(`Transaction submitted: ${tx.hash}`);
      
      const receipt = await tx.wait();
      
      console.log(`NFT minted! Gas used: ${receipt.gasUsed.toString()}`);

      // Mark verification as processed in Guardian
      await this.markVerificationProcessed(verificationId);

      // Return data for Telegram notification
      return {
        success: true,
        txHash: receipt.hash,
        recipient: recipientAddress,
        carbonTons: carbonTonsOffset,
        verificationId
      };

    } catch (error) {
      console.error(`Error processing verification:`, error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Validate Guardian verification data
   */
  validateVerification(verification) {
    if (!verification.recipientAddress || !ethers.isAddress(verification.recipientAddress)) {
      console.error('Invalid recipient address');
      return false;
    }

    if (!verification.carbonTonsOffset || verification.carbonTonsOffset < 1) {
      console.error('Invalid carbon tons offset');
      return false;
    }

    if (!verification.verificationId || verification.verificationId.length === 0) {
      console.error('Missing verification ID');
      return false;
    }

    return true;
  }

  /**
   * Mark verification as processed in Guardian
   */
  async markVerificationProcessed(verificationId) {
    try {
      await axios.post(
        `${this.guardianApiUrl}/api/v1/verifications/${verificationId}/processed`,
        {
          status: 'minted',
          timestamp: new Date().toISOString()
        },
        {
          headers: {
            'Authorization': `Bearer ${this.guardianApiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      console.log(`Verification ${verificationId} marked as processed`);
    } catch (error) {
      console.error('Error marking verification:', error.message);
    }
  }

  /**
   * Manually trigger verification processing (for testing)
   */
  async manualMint(recipientAddress, carbonTons, projectId) {
    const mockVerification = {
      verificationId: `MANUAL-${Date.now()}`,
      recipientAddress,
      carbonTonsOffset: carbonTons,
      issuer: 'Manual Test Issuer',
      projectId: projectId || 'TEST-PROJECT-001',
      verifiableCredentials: {}
    };

    return await this.processVerification(mockVerification);
  }

  /**
   * Get Guardian verification status
   */
  async getVerificationStatus(verificationId) {
    try {
      const response = await axios.get(
        `${this.guardianApiUrl}/api/v1/verifications/${verificationId}`,
        {
          headers: {
            'Authorization': `Bearer ${this.guardianApiKey}`
          }
        }
      );

      return response.data;
    } catch (error) {
      console.error('Error fetching verification status:', error.message);
      return null;
    }
  }

  /**
   * Fetch Guardian project data
   */
  async getGuardianProject(projectId) {
    try {
      const response = await axios.get(
        `${this.guardianApiUrl}/api/v1/projects/${projectId}`,
        {
          headers: {
            'Authorization': `Bearer ${this.guardianApiKey}`
          }
        }
      );

      return response.data;
    } catch (error) {
      console.error('Error fetching project:', error.message);
      return null;
    }
  }
}

// Initialize and start oracle if run directly
if (require.main === module) {
  const oracle = new GuardianOracle();
  oracle.initialize();
}

module.exports = GuardianOracle;
