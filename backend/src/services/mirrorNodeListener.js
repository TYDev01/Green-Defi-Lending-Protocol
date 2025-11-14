const axios = require('axios');
const { ethers } = require('ethers');
require('dotenv').config();

/**
 * Mirror Node Listener
 * Monitors Hedera Mirror Node for contract events
 */
class MirrorNodeListener {
  constructor() {
    this.mirrorNodeUrl = process.env.MIRROR_NODE_URL;
    this.contractAddresses = {
      lendingPool: process.env.LENDING_POOL_ADDRESS,
      greenRewardManager: process.env.GREEN_REWARD_MANAGER_ADDRESS,
      leaderboardTracker: process.env.LEADERBOARD_TRACKER_ADDRESS
    };
    
    this.lastProcessedTimestamp = Date.now() / 1000;
    this.pollingInterval = 10000; // 10 seconds
  }

  /**
   * Start listening for events
   */
  start() {
    console.log('👂 Mirror Node Listener started');
    
    setInterval(async () => {
      try {
        await this.pollEvents();
      } catch (error) {
        console.error('Polling error:', error.message);
      }
    }, this.pollingInterval);
  }

  /**
   * Poll for new events
   */
  async pollEvents() {
    try {
      // Get recent contract results from Mirror Node
      const response = await axios.get(
        `${this.mirrorNodeUrl}/api/v1/contracts/results`,
        {
          params: {
            timestamp: `gt:${this.lastProcessedTimestamp}`,
            limit: 100
          }
        }
      );

      const results = response.data.results || [];

      for (const result of results) {
        await this.processContractResult(result);
      }

      if (results.length > 0) {
        this.lastProcessedTimestamp = results[results.length - 1].timestamp;
      }

    } catch (error) {
      console.error('Error polling events:', error.message);
    }
  }

  /**
   * Process individual contract result
   */
  async processContractResult(result) {
    const contractId = result.to;
    const logs = result.logs || [];

    for (const log of logs) {
      await this.parseAndEmitEvent(contractId, log, result);
    }
  }

  /**
   * Parse log and emit event
   */
  async parseAndEmitEvent(contractId, log, txResult) {
    try {
      // Decode event based on topic (event signature)
      const eventSignature = log.topics[0];

      // NFTMinted event
      if (eventSignature === this.getEventSignature('NFTMinted(uint256,address,uint256,string)')) {
        const event = {
          type: 'NFTMinted',
          tokenId: parseInt(log.topics[1], 16),
          owner: '0x' + log.topics[2].slice(-40),
          timestamp: txResult.timestamp,
          txHash: txResult.hash
        };
        
        await this.onNFTMinted(event);
      }

      // InterestRateAdjusted event
      if (eventSignature === this.getEventSignature('InterestRateAdjusted(address,uint256,uint256)')) {
        const event = {
          type: 'InterestRateAdjusted',
          user: '0x' + log.topics[1].slice(-40),
          timestamp: txResult.timestamp,
          txHash: txResult.hash
        };
        
        await this.onInterestRateAdjusted(event);
      }

      // ScoreUpdated event (Leaderboard)
      if (eventSignature === this.getEventSignature('ScoreUpdated(address,uint256,uint256)')) {
        const event = {
          type: 'ScoreUpdated',
          user: '0x' + log.topics[1].slice(-40),
          timestamp: txResult.timestamp,
          txHash: txResult.hash
        };
        
        await this.onLeaderboardUpdated(event);
      }

      // NFTRetired event
      if (eventSignature === this.getEventSignature('NFTRetired(uint256,address)')) {
        const event = {
          type: 'NFTRetired',
          tokenId: parseInt(log.topics[1], 16),
          owner: '0x' + log.topics[2].slice(-40),
          timestamp: txResult.timestamp,
          txHash: txResult.hash
        };
        
        await this.onNFTRetired(event);
      }

    } catch (error) {
      console.error('Error parsing event:', error.message);
    }
  }

  /**
   * Get event signature hash
   */
  getEventSignature(signature) {
    return ethers.id(signature);
  }

  /**
   * Event handlers
   */
  async onNFTMinted(event) {
    console.log('NFT Minted:', event);
    // Trigger Telegram notification
    // Update Firebase cache
  }

  async onInterestRateAdjusted(event) {
    console.log('📉 Interest Rate Adjusted:', event);
    // Trigger Telegram notification
  }

  async onLeaderboardUpdated(event) {
    console.log('Leaderboard Updated:', event);
    // Update Firebase leaderboard cache
    // Trigger Telegram notification if rank changed significantly
  }

  async onNFTRetired(event) {
    console.log('NFT Retired:', event);
    // Trigger Telegram notification
    // Update stats
  }

  /**
   * Get transaction details
   */
  async getTransactionDetails(txHash) {
    try {
      const response = await axios.get(
        `${this.mirrorNodeUrl}/api/v1/transactions/${txHash}`
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching transaction:', error.message);
      return null;
    }
  }

  /**
   * Get account info
   */
  async getAccountInfo(accountId) {
    try {
      const response = await axios.get(
        `${this.mirrorNodeUrl}/api/v1/accounts/${accountId}`
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching account:', error.message);
      return null;
    }
  }
}

// Start listener if run directly
if (require.main === module) {
  const listener = new MirrorNodeListener();
  listener.start();
}

module.exports = MirrorNodeListener;
