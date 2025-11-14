import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export interface LeaderboardEntry {
  address: string;
  totalCarbonOffset: number;
  nftCount: number;
  rank: number;
  badge: string;
}

export interface UserProfile {
  address: string;
  totalCarbonOffset: number;
  nftCount: number;
  rank: number;
  badge: string;
  nfts: NFT[];
}

export interface NFT {
  tokenId: number;
  carbonTons: number;
  verificationId: string;
  issuer: string;
  projectId: string;
  mintedAt: number;
  isRetired: boolean;
}

export interface ProtocolStats {
  totalDeposits: string;
  totalBorrows: string;
  totalCarbonOffset: string;
  totalNFTs: number;
  activeUsers: number;
  utilization: number;
}

// API functions
export const apiService = {
  // Leaderboard
  async getLeaderboard(limit: number = 100): Promise<LeaderboardEntry[]> {
    const response = await api.get(`/api/leaderboard?limit=${limit}`);
    return response.data.data;
  },

  // User profile
  async getUserProfile(address: string): Promise<UserProfile | null> {
    try {
      const response = await api.get(`/api/user/${address}`);
      return response.data.data;
    } catch (error) {
      return null;
    }
  },

  // Protocol stats
  async getProtocolStats(): Promise<ProtocolStats> {
    const response = await api.get('/api/stats');
    return response.data.data;
  },

  // Guardian verification
  async getGuardianVerification(verificationId: string) {
    const response = await api.get(`/api/guardian/verification/${verificationId}`);
    return response.data.data;
  },

  // Guardian project
  async getGuardianProject(projectId: string) {
    const response = await api.get(`/api/guardian/project/${projectId}`);
    return response.data.data;
  },

  // Telegram subscription
  async subscribeTelegram(chatId: string, walletAddress: string) {
    const response = await api.post('/api/telegram/subscribe', {
      chatId,
      walletAddress,
    });
    return response.data;
  },

  // Mirror Node transaction
  async getTransaction(txHash: string) {
    const response = await api.get(`/api/mirror/transaction/${txHash}`);
    return response.data.data;
  },
};
