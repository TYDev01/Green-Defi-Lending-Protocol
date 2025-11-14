const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');
require('dotenv').config();

/**
 * Telegram Bot Service
 * Sends notifications for NFT minting, interest rate changes, leaderboard updates
 */
class TelegramNotificationBot {
  constructor() {
    this.token = process.env.TELEGRAM_BOT_TOKEN;
    this.bot = new TelegramBot(this.token, { polling: true });
    this.mirrorNodeUrl = process.env.MIRROR_NODE_URL;
    
    // Store user subscriptions (in production, use database)
    this.subscriptions = new Map(); // chatId -> walletAddress
    
    this.setupCommands();
  }

  /**
   * Setup bot commands
   */
  setupCommands() {
    // Start command
    this.bot.onText(/\/start/, (msg) => {
      const chatId = msg.chat.id;
      this.bot.sendMessage(
        chatId,
        '*Welcome to GreenDeFi!*\n\n' +
        'I\'ll notify you about:\n' +
        '- New Carbon Credit NFTs minted\n' +
        '- Interest rate reductions\n' +
        '- Leaderboard updates\n' +
        '- NFT retirements\n\n' +
        'Commands:\n' +
        '/subscribe <wallet_address> - Subscribe to notifications\n' +
        '/unsubscribe - Unsubscribe from notifications\n' +
        '/status - Check your subscription status\n' +
        '/leaderboard - View top contributors\n' +
        '/stats - View protocol statistics',
        { parse_mode: 'Markdown' }
      );
    });

    // Subscribe command
    this.bot.onText(/\/subscribe (.+)/, (msg, match) => {
      const chatId = msg.chat.id;
      const walletAddress = match[1].trim();

      if (this.isValidAddress(walletAddress)) {
        this.subscriptions.set(chatId, walletAddress);
        this.bot.sendMessage(
          chatId,
          `Subscribed! You'll receive notifications for wallet:\n\`${walletAddress}\`",
          { parse_mode: 'Markdown' }
        );
      } else {
        this.bot.sendMessage(chatId, 'Invalid wallet address. Please provide a valid Hedera address.');
      }
    });

    // Unsubscribe command
    this.bot.onText(/\/unsubscribe/, (msg) => {
      const chatId = msg.chat.id;
      
      if (this.subscriptions.has(chatId)) {
        this.subscriptions.delete(chatId);
        this.bot.sendMessage(chatId, 'Unsubscribed from notifications.');
      } else {
        this.bot.sendMessage(chatId, 'You are not subscribed.');
      }
    });

    // Status command
    this.bot.onText(/\/status/, (msg) => {
      const chatId = msg.chat.id;
      
      if (this.subscriptions.has(chatId)) {
        const wallet = this.subscriptions.get(chatId);
        this.bot.sendMessage(
          chatId,
          `*Subscription Active*\n\nWallet: \`${wallet}\`",
          { parse_mode: 'Markdown' }
        );
      } else {
        this.bot.sendMessage(chatId, 'Not subscribed. Use /subscribe <wallet_address> to start.');
      }
    });

    // Leaderboard command
    this.bot.onText(/\/leaderboard/, async (msg) => {
      const chatId = msg.chat.id;
      await this.sendLeaderboard(chatId);
    });

    // Stats command
    this.bot.onText(/\/stats/, async (msg) => {
      const chatId = msg.chat.id;
      await this.sendProtocolStats(chatId);
    });

    console.log('Telegram bot commands initialized');
  }

  /**
   * Validate Hedera address
   */
  isValidAddress(address) {
    // Basic validation for Ethereum-style address (Hedera EVM)
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  }

  /**
   * Send NFT minted notification
   */
  async notifyNFTMinted(walletAddress, tokenId, carbonTons, verificationId) {
    const chatIds = this.getChatIdsByWallet(walletAddress);
    
    const message = 
      `*New Carbon Credit NFT Minted!*\n\n` +
      `Token ID: \`${tokenId}\`\n` +
      `Carbon Offset: *${carbonTons} tons CO₂*\n` +
      `Verification: \`${verificationId}\`\n\n` +
      `Your contribution is making a real impact!`;

    for (const chatId of chatIds) {
      try {
        await this.bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
      } catch (error) {
        console.error(`Error sending to ${chatId}:`, error.message);
      }
    }
  }

  /**
   * Send interest rate reduction notification
   */
  async notifyInterestRateReduction(walletAddress, oldRate, newRate, reduction) {
    const chatIds = this.getChatIdsByWallet(walletAddress);
    
    const message = 
      `*Interest Rate Reduced!*\n\n` +
      `Previous Rate: ${oldRate}%\n` +
      `New Rate: *${newRate}%*\n` +
      `Reduction: *-${reduction}%*\n\n` +
      `Keep offsetting carbon to maintain your green discount!`;

    for (const chatId of chatIds) {
      try {
        await this.bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
      } catch (error) {
        console.error(`Error sending to ${chatId}:`, error.message);
      }
    }
  }

  /**
   * Send leaderboard update notification
   */
  async notifyLeaderboardUpdate(walletAddress, oldRank, newRank, badge) {
    const chatIds = this.getChatIdsByWallet(walletAddress);
    
    const message = 
      `*Leaderboard Update!*\n\n` +
      `Previous Rank: #${oldRank}\n` +
      `New Rank: *#${newRank}*\n` +
      `Badge: ${badge}\n\n` +
      `Amazing progress! Keep climbing!`;

    for (const chatId of chatIds) {
      try {
        await this.bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
      } catch (error) {
        console.error(`Error sending to ${chatId}:`, error.message);
      }
    }
  }

  /**
   * Send NFT retirement notification
   */
  async notifyNFTRetired(walletAddress, tokenId, carbonTons, bonusReward) {
    const chatIds = this.getChatIdsByWallet(walletAddress);
    
    const message = 
      `*NFT Retired!*\n\n` +
      `Token ID: \`${tokenId}\`\n` +
      `Permanent Impact: *${carbonTons} tons CO₂*\n` +
      `Bonus Reward: *${bonusReward} GREEN*\n\n` +
      `Your contribution is permanently recorded on-chain!`;

    for (const chatId of chatIds) {
      try {
        await this.bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
      } catch (error) {
        console.error(`Error sending to ${chatId}:`, error.message);
      }
    }
  }

  /**
   * Send leaderboard to user
   */
  async sendLeaderboard(chatId) {
    try {
      // This would call the backend API to get leaderboard data
      const leaderboardData = await this.fetchLeaderboardData();
      
      let message = '*Top Climate Champions*\n\n';
      
      leaderboardData.forEach((user, index) => {
        message += `#${index + 1} - ${user.shortAddress}\n`;
        message += `   ${user.carbonOffset} tons CO₂\n\n`;
      });

      await this.bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
    } catch (error) {
      console.error('Error sending leaderboard:', error.message);
      await this.bot.sendMessage(chatId, 'Error fetching leaderboard data.');
    }
  }

  /**
   * Send protocol statistics
   */
  async sendProtocolStats(chatId) {
    try {
      const stats = await this.fetchProtocolStats();
      
      const message = 
        `*GreenDeFi Protocol Statistics*\n\n` +
        `Total Deposits: *${stats.totalDeposits} HBAR*\n` +
        `Total Borrows: *${stats.totalBorrows} HBAR*\n` +
        `Total CO₂ Offset: *${stats.totalCarbonOffset} tons*\n` +
        `NFTs Minted: *${stats.totalNFTs}*\n` +
        `Active Users: *${stats.activeUsers}*\n` +
        `Utilization: *${stats.utilization}%*\n\n` +
        `Join the green revolution!`;

      await this.bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
    } catch (error) {
      console.error('Error sending stats:', error.message);
      await this.bot.sendMessage(chatId, 'Error fetching protocol statistics.');
    }
  }

  /**
   * Get chat IDs for a wallet address
   */
  getChatIdsByWallet(walletAddress) {
    const chatIds = [];
    for (const [chatId, wallet] of this.subscriptions.entries()) {
      if (wallet.toLowerCase() === walletAddress.toLowerCase()) {
        chatIds.push(chatId);
      }
    }
    return chatIds;
  }

  /**
   * Fetch leaderboard data from backend
   */
  async fetchLeaderboardData() {
    // Mock data - in production, call your API
    return [
      { address: '0x1234...5678', shortAddress: '0x1234...5678', carbonOffset: 150 },
      { address: '0x8765...4321', shortAddress: '0x8765...4321', carbonOffset: 120 },
      { address: '0xabcd...ef01', shortAddress: '0xabcd...ef01', carbonOffset: 95 }
    ];
  }

  /**
   * Fetch protocol statistics
   */
  async fetchProtocolStats() {
    // Mock data - in production, call your API
    return {
      totalDeposits: '1,250,000',
      totalBorrows: '850,000',
      totalCarbonOffset: '2,450',
      totalNFTs: 145,
      activeUsers: 387,
      utilization: 68
    };
  }

  /**
   * Get subscriptions (for persistence)
   */
  getSubscriptions() {
    return Array.from(this.subscriptions.entries());
  }

  /**
   * Load subscriptions (from database)
   */
  loadSubscriptions(subscriptionsArray) {
    this.subscriptions = new Map(subscriptionsArray);
  }
}

// Initialize bot if run directly
if (require.main === module) {
  const bot = new TelegramNotificationBot();
  console.log('Telegram bot started!');
}

module.exports = TelegramNotificationBot;
