'use client';

import { useEffect, useState } from 'react';
import { useWallet } from '@/contexts/WalletContext';
import { apiService } from '@/lib/api';
import { TrendingUp, DollarSign, Leaf, Users } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function Dashboard() {
  const { account, isConnected } = useWallet();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const data = await apiService.getProtocolStats();
      setStats(data);
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  // Mock chart data, 
  const chartData = [
    { name: 'Jan', carbon: 400 },
    { name: 'Feb', carbon: 600 },
    { name: 'Mar', carbon: 800 },
    { name: 'Apr', carbon: 1200 },
    { name: 'May', carbon: 1600 },
    { name: 'Jun', carbon: 2450 },
  ];

  if (!isConnected) {
    return (
      <div className="text-center py-20">
        <div className="text-6xl mb-4">🔒</div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Connect Your Wallet</h2>
        <p className="text-gray-600">Please connect your wallet to view the dashboard</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="text-center py-20">
        <div className="animate-spin text-6xl mb-4">⌛</div>
        <p className="text-gray-600">Loading protocol data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl p-8 text-white">
        <h1 className="text-3xl font-bold mb-2">Welcome to GreenDeFi</h1>
        <p className="text-lg text-green-100">
          Lend, borrow, and earn rewards while offsetting carbon emissions on Hedera's carbon-negative network
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          icon={<DollarSign />}
          title="Total Deposits"
          value={stats?.totalDeposits || '0'}
          suffix="HBAR"
          color="blue"
        />
        <StatCard
          icon={<TrendingUp />}
          title="Total Borrows"
          value={stats?.totalBorrows || '0'}
          suffix="HBAR"
          color="purple"
        />
        <StatCard
          icon={<Leaf />}
          title="CO₂ Offset"
          value={stats?.totalCarbonOffset || '0'}
          suffix="tons"
          color="green"
        />
        <StatCard
          icon={<Users />}
          title="Active Users"
          value={stats?.activeUsers || '0'}
          suffix=""
          color="orange"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Carbon Offset Trend */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-bold mb-4">Carbon Offset Trend</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="carbon" stroke="#10b981" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Protocol Health */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-bold mb-4">Protocol Health</h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-gray-600">Utilization Rate</span>
                <span className="font-bold">{stats?.utilization || 0}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-green-500 h-3 rounded-full"
                  style={{ width: `${stats?.utilization || 0}%` }}
                ></div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 pt-4">
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{stats?.totalNFTs || 0}</div>
                <div className="text-sm text-gray-600">NFTs Minted</div>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">8.5%</div>
                <div className="text-sm text-gray-600">Avg APY</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Top Contributors Preview */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold">Top Climate Champions</h3>
          <a href="/leaderboard" className="text-green-600 hover:text-green-700 font-semibold">
            View All →
          </a>
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((rank) => (
            <div key={rank} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="text-2xl font-bold">#{rank}</div>
                <div>
                  <div className="font-semibold">0x1234...5678</div>
                  <div className="text-sm text-gray-600">{150 - rank * 20} tons CO₂</div>
                </div>
              </div>
              <div className="text-green-600 font-bold">#{rank}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, title, value, suffix, color }: any) {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600',
    purple: 'bg-purple-100 text-purple-600',
    green: 'bg-green-100 text-green-600',
    orange: 'bg-orange-100 text-orange-600',
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className={`inline-block p-3 rounded-lg ${colorClasses[color as keyof typeof colorClasses]} mb-4`}>
        {icon}
      </div>
      <h3 className="text-gray-600 text-sm font-semibold mb-1">{title}</h3>
      <div className="text-3xl font-bold text-gray-800">
        {value} <span className="text-lg text-gray-500">{suffix}</span>
      </div>
    </div>
  );
}
