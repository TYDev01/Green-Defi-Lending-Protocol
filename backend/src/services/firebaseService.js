const admin = require('firebase-admin');
require('dotenv').config();

/**
 * Firebase Service for caching leaderboard and user data
 */
class FirebaseService {
  constructor() {
    // Initialize Firebase Admin
    const serviceAccount = {
      projectId: process.env.FIREBASE_PROJECT_ID,
      // Add other Firebase credentials from env
    };

    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        databaseURL: process.env.FIREBASE_DATABASE_URL
      });
    }

    this.db = admin.firestore();
    this.leaderboardRef = this.db.collection('leaderboard');
    this.usersRef = this.db.collection('users');
    this.statsRef = this.db.collection('stats');
  }

  /**
   * Update leaderboard entry
   */
  async updateLeaderboard(address, data) {
    try {
      await this.leaderboardRef.doc(address).set({
        address,
        totalCarbonOffset: data.totalCarbonOffset,
        nftCount: data.nftCount,
        rank: data.rank,
        badge: data.badge,
        lastUpdate: admin.firestore.FieldValue.serverTimestamp()
      }, { merge: true });

      console.log(`Leaderboard updated for ${address}`);
    } catch (error) {
      console.error('Error updating leaderboard:', error.message);
    }
  }

  /**
   * Get top contributors
   */
  async getTopContributors(limit = 100) {
    try {
      const snapshot = await this.leaderboardRef
        .orderBy('totalCarbonOffset', 'desc')
        .limit(limit)
        .get();

      const contributors = [];
      snapshot.forEach(doc => {
        contributors.push({ id: doc.id, ...doc.data() });
      });

      return contributors;
    } catch (error) {
      console.error('Error fetching top contributors:', error.message);
      return [];
    }
  }

  /**
   * Get user profile
   */
  async getUserProfile(address) {
    try {
      const doc = await this.usersRef.doc(address).get();
      
      if (doc.exists) {
        return doc.data();
      }
      return null;
    } catch (error) {
      console.error('Error fetching user profile:', error.message);
      return null;
    }
  }

  /**
   * Update user profile
   */
  async updateUserProfile(address, data) {
    try {
      await this.usersRef.doc(address).set({
        address,
        ...data,
        lastUpdate: admin.firestore.FieldValue.serverTimestamp()
      }, { merge: true });

      console.log(`User profile updated for ${address}`);
    } catch (error) {
      console.error('Error updating user profile:', error.message);
    }
  }

  /**
   * Add NFT to user's collection
   */
  async addUserNFT(address, nftData) {
    try {
      const nftsRef = this.usersRef.doc(address).collection('nfts');
      
      await nftsRef.doc(nftData.tokenId.toString()).set({
        tokenId: nftData.tokenId,
        carbonTons: nftData.carbonTons,
        verificationId: nftData.verificationId,
        issuer: nftData.issuer,
        projectId: nftData.projectId,
        mintedAt: nftData.timestamp,
        isRetired: false
      });

      console.log(`NFT ${nftData.tokenId} added for ${address}`);
    } catch (error) {
      console.error('Error adding NFT:', error.message);
    }
  }

  /**
   * Mark NFT as retired
   */
  async retireNFT(address, tokenId) {
    try {
      const nftsRef = this.usersRef.doc(address).collection('nfts');
      
      await nftsRef.doc(tokenId.toString()).update({
        isRetired: true,
        retiredAt: admin.firestore.FieldValue.serverTimestamp()
      });

      console.log(`NFT ${tokenId} retired for ${address}`);
    } catch (error) {
      console.error('Error retiring NFT:', error.message);
    }
  }

  /**
   * Update protocol statistics
   */
  async updateStats(stats) {
    try {
      await this.statsRef.doc('protocol').set({
        ...stats,
        lastUpdate: admin.firestore.FieldValue.serverTimestamp()
      }, { merge: true });

      console.log('Protocol stats updated');
    } catch (error) {
      console.error('Error updating stats:', error.message);
    }
  }

  /**
   * Get protocol statistics
   */
  async getStats() {
    try {
      const doc = await this.statsRef.doc('protocol').get();
      
      if (doc.exists) {
        return doc.data();
      }
      return null;
    } catch (error) {
      console.error('Error fetching stats:', error.message);
      return null;
    }
  }

  /**
   * Store Telegram subscription
   */
  async addTelegramSubscription(chatId, walletAddress) {
    try {
      await this.db.collection('telegram_subscriptions').doc(chatId.toString()).set({
        chatId,
        walletAddress,
        subscribedAt: admin.firestore.FieldValue.serverTimestamp(),
        active: true
      });

      console.log(`Telegram subscription added for ${walletAddress}`);
    } catch (error) {
      console.error('Error adding subscription:', error.message);
    }
  }

  /**
   * Remove Telegram subscription
   */
  async removeTelegramSubscription(chatId) {
    try {
      await this.db.collection('telegram_subscriptions').doc(chatId.toString()).delete();
      console.log(`Telegram subscription removed for ${chatId}`);
    } catch (error) {
      console.error('Error removing subscription:', error.message);
    }
  }

  /**
   * Get all Telegram subscriptions
   */
  async getTelegramSubscriptions() {
    try {
      const snapshot = await this.db.collection('telegram_subscriptions')
        .where('active', '==', true)
        .get();

      const subscriptions = [];
      snapshot.forEach(doc => {
        subscriptions.push(doc.data());
      });

      return subscriptions;
    } catch (error) {
      console.error('Error fetching subscriptions:', error.message);
      return [];
    }
  }
}

module.exports = FirebaseService;
