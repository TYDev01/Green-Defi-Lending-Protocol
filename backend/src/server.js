const express = require('express');
const cors = require('cors');
const GuardianOracle = require('./services/guardianOracle');
const TelegramBot = require('./services/telegramBot');
const MirrorNodeListener = require('./services/mirrorNodeListener');
const FirebaseService = require('./services/firebaseService');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize services
const guardianOracle = new GuardianOracle();
const telegramBot = new TelegramBot();
const mirrorNodeListener = new MirrorNodeListener();
const firebaseService = new FirebaseService();

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes

/**
 * Get leaderboard
 */
app.get('/api/leaderboard', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 100;
    const leaderboard = await firebaseService.getTopContributors(limit);
    res.json({ success: true, data: leaderboard });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Get user profile
 */
app.get('/api/user/:address', async (req, res) => {
  try {
    const { address } = req.params;
    const profile = await firebaseService.getUserProfile(address);
    
    if (!profile) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    
    res.json({ success: true, data: profile });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Get protocol statistics
 */
app.get('/api/stats', async (req, res) => {
  try {
    const stats = await firebaseService.getStats();
    res.json({ success: true, data: stats });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Get Guardian verification status
 */
app.get('/api/guardian/verification/:verificationId', async (req, res) => {
  try {
    const { verificationId } = req.params;
    const status = await guardianOracle.getVerificationStatus(verificationId);
    res.json({ success: true, data: status });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Get Guardian project details
 */
app.get('/api/guardian/project/:projectId', async (req, res) => {
  try {
    const { projectId } = req.params;
    const project = await guardianOracle.getGuardianProject(projectId);
    res.json({ success: true, data: project });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Manual NFT mint (for testing)
 */
app.post('/api/guardian/manual-mint', async (req, res) => {
  try {
    const { recipientAddress, carbonTons, projectId } = req.body;
    
    if (!recipientAddress || !carbonTons) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required fields' 
      });
    }
    
    const result = await guardianOracle.manualMint(
      recipientAddress,
      carbonTons,
      projectId
    );
    
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Subscribe to Telegram notifications
 */
app.post('/api/telegram/subscribe', async (req, res) => {
  try {
    const { chatId, walletAddress } = req.body;
    
    if (!chatId || !walletAddress) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required fields' 
      });
    }
    
    await firebaseService.addTelegramSubscription(chatId, walletAddress);
    res.json({ success: true, message: 'Subscribed successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Webhook for Guardian events (if supported)
 */
app.post('/api/webhook/guardian', async (req, res) => {
  try {
    const verification = req.body;
    
    // Process verification
    const result = await guardianOracle.processVerification(verification);
    
    if (result.success) {
      // Send Telegram notification
      await telegramBot.notifyNFTMinted(
        result.recipient,
        result.tokenId,
        result.carbonTons,
        result.verificationId
      );
    }
    
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Get Mirror Node transaction
 */
app.get('/api/mirror/transaction/:txHash', async (req, res) => {
  try {
    const { txHash } = req.params;
    const tx = await mirrorNodeListener.getTransactionDetails(txHash);
    res.json({ success: true, data: tx });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Start services
async function startServer() {
  try {
    console.log('Starting GreenDeFi Backend...');
    
    // Initialize Guardian Oracle
    await guardianOracle.initialize();
    
    // Start Mirror Node Listener
    mirrorNodeListener.start();
    
    // Load Telegram subscriptions from Firebase
    const subscriptions = await firebaseService.getTelegramSubscriptions();
    console.log(`Loaded ${subscriptions.length} Telegram subscriptions`);
    
    // Start Express server
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`Guardian Oracle: Active`);
      console.log(`Telegram Bot: Active`);
      console.log(`👂 Mirror Node Listener: Active`);
      console.log(`Firebase: Connected`);
    });
  } catch (error) {
    console.error('Error starting server:', error);
    process.exit(1);
  }
}

// Error handlers
process.on('unhandledRejection', (error) => {
  console.error('Unhandled Rejection:', error);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

// Start the server
startServer();

module.exports = app;
